import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Email, type InsertEmail, insertEmailSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Send, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface EmailPanelProps {
  parentType: "Quote" | "Opportunity" | "Account" | "Case";
  parentId: string;
}

export default function EmailPanel({ parentType, parentId }: EmailPanelProps) {
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [deleteEmailId, setDeleteEmailId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: emails = [], isLoading } = useQuery<Email[]>({
    queryKey: ["/api/emails", parentType, parentId],
    enabled: !!parentType && !!parentId,
  });

  const form = useForm<InsertEmail>({
    resolver: zodResolver(insertEmailSchema.omit({ createdBy: true, companyId: true })),
    defaultValues: {
      subject: "",
      body: "",
      fromEmail: user?.email || "",
      toEmail: "",
      ccEmail: "",
      bccEmail: "",
      parentType,
      parentId,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmail) => {
      const response = await apiRequest("POST", "/api/emails", {
        ...data,
        createdBy: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", parentType, parentId] });
      toast({
        title: "Success",
        description: "Email sent successfully",
      });
      setIsComposeOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send email",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (emailId: string) => {
      await apiRequest("DELETE", `/api/emails/${emailId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emails", parentType, parentId] });
      toast({
        title: "Success",
        description: "Email deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete email",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertEmail) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading emails...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Emails</CardTitle>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button size="sm" data-testid="button-compose-email">
              <Mail className="w-4 h-4 mr-2" />
              Compose Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose Email</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-from-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="toEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-to-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ccEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CC (optional, comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-cc-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bccEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BCC (optional, comma-separated)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} data-testid="input-bcc-email" />
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
                        <Input {...field} data-testid="input-subject" />
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
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          rows={10}
                          data-testid="input-body"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsComposeOpen(false)}
                    data-testid="button-cancel-email"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-send-email"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createMutation.isPending ? "Sending..." : "Send Email"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <p className="text-muted-foreground text-center py-8" data-testid="text-no-emails">
            No emails yet. Click "Compose Email" to send one.
          </p>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => (
              <div
                key={email.id}
                className="border rounded-lg p-4 space-y-2"
                data-testid={`email-${email.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold" data-testid={`text-subject-${email.id}`}>
                        {email.subject}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div data-testid={`text-from-${email.id}`}>
                        <span className="font-medium">From:</span> {email.fromEmail}
                      </div>
                      <div data-testid={`text-to-${email.id}`}>
                        <span className="font-medium">To:</span> {email.toEmail}
                      </div>
                      {email.ccEmail && (
                        <div data-testid={`text-cc-${email.id}`}>
                          <span className="font-medium">CC:</span> {email.ccEmail}
                        </div>
                      )}
                      {email.bccEmail && (
                        <div data-testid={`text-bcc-${email.id}`}>
                          <span className="font-medium">BCC:</span> {email.bccEmail}
                        </div>
                      )}
                      {email.sentAt && (
                        <div data-testid={`text-sent-${email.id}`}>
                          <span className="font-medium">Sent:</span>{" "}
                          {format(new Date(email.sentAt), "PPp")}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteEmailId(email.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-email-${email.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 text-sm whitespace-pre-wrap" data-testid={`text-body-${email.id}`}>
                  {email.body}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteEmailId} onOpenChange={() => setDeleteEmailId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this email? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteEmailId) {
                  deleteMutation.mutate(deleteEmailId);
                  setDeleteEmailId(null);
                }
              }}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
