"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { sendContactEmail } from "../actions";
import { useActionState } from "react";
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
    <div className="container mx-auto px-6 py-12 flex justify-center text-foreground">
      <Card className="w-full max-w-lg bg-card text-card-foreground border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Contact Support
          </CardTitle>
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
  );
}
