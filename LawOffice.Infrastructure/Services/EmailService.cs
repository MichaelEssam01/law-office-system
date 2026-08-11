using System.Net;
using System.Net.Mail;
using LawOffice.Application.Common.Settings;
using LawOffice.Application.Interfaces.Services;
using Microsoft.Extensions.Options;

namespace LawOffice.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly MailSettings _mailSettings;

    public EmailService(IOptions<MailSettings> mailSettings)
    {
        _mailSettings = mailSettings.Value;
    }

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            using var client = new SmtpClient(_mailSettings.Server, _mailSettings.Port)
            {
                Credentials = new NetworkCredential(_mailSettings.UserName, _mailSettings.Password),
                EnableSsl = true
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_mailSettings.SenderEmail, _mailSettings.SenderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            mailMessage.To.Add(to);

            await client.SendMailAsync(mailMessage);
        }
        catch (Exception ex)
        {
            // Log error but don't crash the request in development
            // This allows the user to see the OTP in the console even if SMTP fails
            Console.WriteLine($"[EMAIL ERROR] Failed to send email to {to}: {ex.Message}");
            
            // In a real production app, we might want to throw or handle this differently
            // but for local dev/testing, we want the flow to continue.
        }
    }
}
