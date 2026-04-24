using System.Text;
using LawOffice.Application.Common.Security;
using LawOffice.Domain.Entities;
using LawOffice.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add Controllers
builder.Services.AddControllers();

// DB Context
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<User, IdentityRole<Guid>>(options => {
    options.Password.RequiredLength = 6;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// JWT Authentication
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
var key = Encoding.ASCII.GetBytes(jwtSettings!.Secret);

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.RequireHttpsMetadata = false;
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

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

// Seed Data (Development only)
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        await DatabaseSeeder.SeedRolesAndAdminAsync(roleManager, userManager, app.Configuration);
    }
}

app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();