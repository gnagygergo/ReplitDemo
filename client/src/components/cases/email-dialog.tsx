import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Mail, Send } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type CaseWithAccount } from "@shared/schema";

const emailSchema = z.object({
  to: z.string().email("Please enter a valid recipient email"),
  from: z.string().email("Please enter a valid sender email"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body is required")
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailDialogProps {
  open: boolean;
  onClose: () => void;
  case?: CaseWithAccount;
}

export default function EmailDialog({ open, onClose, case: caseItem }: EmailDialogProps) {
  const { toast } = useToast();

  const form = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      to: caseItem?.fromEmail || "",
      from: "",
      subject: caseItem?.subject ? `Re: ${caseItem.subject}` : "",
      body: ""
    }
  });

  const sendEmailMutation = useMutation({
    mutationFn: (data: EmailFormData) => apiRequest("POST", "/api/send-email", data),
    onSuccess: () => {
      toast({
        title: "Email sent successfully",
        description: "Your email has been sent to the recipient.",
      });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmailFormData) => {
    sendEmailMutation.mutate(data);
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="w-5 h-5" />
            <span>Send an Email</span>
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="recipient@example.com"
                      {...field}
                      data-testid="input-email-to"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="from"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="your-email@example.com"
                      {...field}
                      data-testid="input-email-from"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter email subject"
                      {...field}
                      data-testid="input-email-subject"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your email message"
                      rows={6}
                      {...field}
                      data-testid="textarea-email-body"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel-email"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={sendEmailMutation.isPending}
                className="flex items-center space-x-2"
                data-testid="button-send-email"
              >
                <Send className="w-4 h-4" />
                <span>{sendEmailMutation.isPending ? "Sending..." : "Send Email"}</span>
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}