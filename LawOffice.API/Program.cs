using System.Text;
using Microsoft.AspNetCore.Authorization;
using LawOffice.Application.Common.Security;
using LawOffice.Application.Common.Settings;
using LawOffice.Domain.Entities;
using LawOffice.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddDistributedMemoryCache(); // Distributed Cache for production-ready OTP storage
builder.Services.AddMemoryCache();
builder.Services.AddSignalR();

// DB Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options => {
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(2);
    options.Lockout.MaxFailedAccessAttempts = 10;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders()
.AddTokenProvider<LawOffice.Application.Common.Security.ShortLivedTokenProvider<User>>("ShortLived");

// Default lifespan for standard Identity tokens (Email confirmation, etc)
builder.Services.Configure<DataProtectionTokenProviderOptions>(options =>
{
    options.TokenLifespan = TimeSpan.FromHours(24);
});

// JWT Authentication
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
var key = Encoding.ASCII.GetBytes(jwtSettings!.Secret);

// Settings
builder.Services.Configure<MailSettings>(builder.Configuration.GetSection("MailSettings"));
builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        ClockSkew = TimeSpan.Zero
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Cookies["accessToken"];
            if (!string.IsNullOrEmpty(accessToken))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddFixedWindowLimiter("AuthPolicy", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(15);
        opt.PermitLimit = 10; // 10 attempts per window
        opt.QueueLimit = 0;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    });
});

// Antiforgery
builder.Services.AddAntiforgery(options => 
{
    options.HeaderName = "X-XSRF-TOKEN";
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment()
        ? CookieSecurePolicy.None
        : CookieSecurePolicy.Always;
    options.Cookie.SameSite = builder.Environment.IsDevelopment() ? SameSiteMode.Lax : SameSiteMode.None;
});

// Authorization
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    // Dynamically register all permissions as policies
    var permissions = typeof(Permissions).GetNestedTypes()
        .SelectMany(t => t.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy))
        .Where(f => f.IsLiteral && !f.IsInitOnly)
        .Select(f => f.GetRawConstantValue()?.ToString())
        .Where(v => v != null)
        .Cast<string>();

    foreach (var permission in permissions)
    {
        options.AddPolicy(permission, policy => policy.Requirements.Add(new PermissionRequirement(permission)));
    }
});

// Repositories
builder.Services.AddScoped(typeof(LawOffice.Application.Interfaces.Repositories.IRepository<>), typeof(LawOffice.Infrastructure.Repositories.Repository<>));
builder.Services.AddScoped<LawOffice.Application.Interfaces.Repositories.IUnitOfWork, LawOffice.Infrastructure.Repositories.UnitOfWork>();

// Services
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IAuthService, LawOffice.Application.Services.AuthService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IClientService, LawOffice.Application.Services.ClientService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.ICaseService, LawOffice.Application.Services.CaseService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.ISessionService, LawOffice.Application.Services.SessionService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IInvoiceService, LawOffice.Application.Services.InvoiceService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IPaymentService, LawOffice.Application.Services.PaymentService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IFinanceService, LawOffice.Application.Services.FinanceService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IDocumentService, LawOffice.Application.Services.DocumentService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IDashboardService, LawOffice.Application.Services.DashboardService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.ISettingsService, LawOffice.Application.Services.SettingsService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IUserService, LawOffice.Application.Services.UserService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IEmailService, LawOffice.Infrastructure.Services.EmailService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IAuditService, LawOffice.Application.Services.AuditService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.IUserProfileService, LawOffice.Application.Services.UserProfileService>();
builder.Services.AddScoped<LawOffice.Application.Interfaces.Services.INotificationService, LawOffice.Application.Services.NotificationService>();

// CORS
builder.Services.AddCors(options =>
{
    var frontendUrl = builder.Configuration["AppSettings:FrontendBaseUrl"] ?? "http://localhost:4200";
    options.AddPolicy("AllowAngular",
        policy => policy
            .WithOrigins(frontendUrl)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

// Seed Data (Development only)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await DatabaseSeeder.SeedRolesAndAdminAsync(roleManager, userManager, context, app.Configuration);
    }
}

app.UseCors("AllowAngular");

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' fonts.gstatic.com;");
    await next();
});

app.Use((context, next) =>
{
    var isProd = app.Environment.IsProduction(); // or !app.Environment.IsDevelopment()
    var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();
    var tokens = antiforgery.GetAndStoreTokens(context);
    context.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, 
        new CookieOptions { 
            HttpOnly = false, 
            Secure = isProd || context.Request.IsHttps, 
            SameSite = isProd ? SameSiteMode.None : SameSiteMode.Lax,
            Path = "/"
        });
    return next();
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<LawOffice.Application.Hubs.NotificationHub>("/hubs/notifications");
app.Run();