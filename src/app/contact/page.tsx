"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { sendContactEmail } from "../actions";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { useEffect } from "react";

const initialState = {
  success: false,
  message: "",
};

export default function Contact() {
  const [state, formAction, isPending] = useActionState(
    sendContactEmail,
    initialState
  );

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success(state.message);
        // Optional: Reset form here if you have a ref to it
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  return (
    <div className="container mx-auto px-6 py-12 text-foreground">
      <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
        {/* LEFT: Contact Information */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4">Get in touch</h1>
            <p className="text-muted-foreground">
              We&apos;d love to hear from you. Our team is always here to chat.
            </p>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 flex items-start gap-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <p className="text-sm text-muted-foreground mb-1">
                    Our friendly team is here to help.
                  </p>
                  <a
                    href="mailto:support@digital-mafia.co.za"
                    className="text-primary hover:underline"
                  >
                    support@digital-mafia.co.za
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* RIGHT: Form (Existing) */}
        <div>
          <Card className="w-full h-full bg-card text-card-foreground border-border">
            <CardHeader>
              <CardTitle className="text-2xl">Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="name">
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Your name"
                    required
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="help@fashion.co.za"
                    required
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="message">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="How can we help?"
                    className="min-h-[120px] bg-background border-input"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
