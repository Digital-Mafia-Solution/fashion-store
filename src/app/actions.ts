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

export async function sendContactEmail(prevState: State, formData: FormData) {
  try {
    const validatedFields = ContactSchema.parse({
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    });

    const { error } = await resend.emails.send({
      // 1. From YOU (Verified Domain) - Ensures delivery
      from: "Fashion Store Contact <support@digital-mafia.co.za>",
      
      // 2. To YOU (Support Inbox)
      to: ["support@digital-mafia.co.za"],
      
      // 3. Reply-To THE USER - When you click reply, it goes to them
      replyTo: validatedFields.email,
      
      subject: `New Contact Form Submission from ${validatedFields.name}`,
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