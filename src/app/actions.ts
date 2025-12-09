"use server";

import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1),
});

type State = {
  success: boolean;
  message: string;
};

// HTML Template for the internal support email
const getContactEmailHTML = (name: string, email: string, message: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Support Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    
    <div style="background-color: #1b5523; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600; letter-spacing: -0.5px;">New Customer Inquiry</h1>
    </div>

    <div style="padding: 32px;">
      
      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 4px;">Customer Name</label>
        <div style="font-size: 16px; font-weight: 500; color: #111;">${name}</div>
      </div>

      <div style="margin-bottom: 24px;">
        <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 4px;">Reply Email</label>
        <a href="mailto:${email}" style="font-size: 16px; color: #1b5523; text-decoration: none; font-weight: 500;">${email}</a>
      </div>

      <div style="margin-bottom: 8px;">
        <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #666; letter-spacing: 0.5px; margin-bottom: 8px;">Message</label>
        <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; font-size: 15px; color: #333; white-space: pre-wrap;">${message}</div>
      </div>

    </div>

    <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; font-size: 12px; color: #6b7280;">
        Sent via Digital Mafia Fashion Contact Form
      </p>
    </div>
  </div>
</body>
</html>
`;

export async function sendContactEmail(prevState: State, formData: FormData) {
  try {
    const validatedFields = ContactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    });

    const { error } = await resend.emails.send({
      from: "Fashion Store Support <support@digital-mafia.co.za>",
      to: ["support@digital-mafia.co.za"],
      replyTo: validatedFields.email, // Allows you to hit "Reply" and email the customer directly
      subject: `New Inquiry: ${validatedFields.name}`,
      // Use the HTML template
      html: getContactEmailHTML(validatedFields.name, validatedFields.email, validatedFields.message),
      // Fallback text version
      text: `Name: ${validatedFields.name}\nEmail: ${validatedFields.email}\n\nMessage:\n${validatedFields.message}`,
    });

    if (error) {
      return { success: false, message: "Failed to send email. Please try again." };
    }

    return { success: true, message: "Message sent! We'll get back to you shortly." };
  } catch {
    return { success: false, message: "Invalid form data. Please check your inputs." };
  }
}