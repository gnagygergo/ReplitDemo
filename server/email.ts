import { MailService } from '@sendgrid/mail';

const mailService = process.env.SENDGRID_API_KEY ? new MailService() : null;
if (mailService && process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
}

export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
  if (!mailService) {
    console.warn('Email not sent: SENDGRID_API_KEY is not configured');
    return { success: false, error: "Email service is not configured. Please set SENDGRID_API_KEY environment variable." };
  }
  
  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || params.subject,
      html: params.html,
      cc: params.cc,
      bcc: params.bcc,
    });
    console.log(`Email sent successfully from ${params.from} to ${params.to}`);
    return { success: true };
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response?.body);
    
    let errorMessage = "Failed to send email";
    if (error.code === 403) {
      errorMessage = "Email sender not verified. Please verify your sender email address in SendGrid.";
    } else if (error.code === 401) {
      errorMessage = "Invalid SendGrid API key.";
    } else if (error.response?.body?.errors?.length > 0) {
      errorMessage = error.response.body.errors[0].message;
    }
    
    return { success: false, error: errorMessage };
  }
}