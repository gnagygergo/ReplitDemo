import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, Languages as LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Language, InsertLanguage } from "@shared/schema";
import { insertLanguageSchema } from "@shared/schema";

type LanguageForm = z.infer<typeof insertLanguageSchema>;

function LanguageEditDialog({
  language,
  onClose,
}: {
  language: Language;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LanguageForm>({
    resolver: zodResolver(insertLanguageSchema),
    defaultValues: {
      languageCode: language.languageCode || "",
      languageName: language.languageName || "",
    },
  });

  const updateLanguageMutation = useMutation({
    mutationFn: async (data: LanguageForm) => {
      return await apiRequest("PATCH", `/api/languages/${language.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Success",
        description: "Language updated successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update language",
      });
    },
  });

  const onSubmit = (data: LanguageForm) => {
    updateLanguageMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Language</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="languageCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., en, fr, es"
                    {...field}
                    data-testid="input-language-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="languageName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., English, French, Spanish"
                    {...field}
                    data-testid="input-language-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateLanguageMutation.isPending}
              data-testid="button-update-language"
            >
              {updateLanguageMutation.isPending ? "Updating..." : "Update Language"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

function LanguageCreateDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LanguageForm>({
    resolver: zodResolver(insertLanguageSchema),
    defaultValues: {
      languageCode: "",
      languageName: "",
    },
  });

  const createLanguageMutation = useMutation({
    mutationFn: async (data: LanguageForm) => {
      return await apiRequest("POST", "/api/languages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Success",
        description: "Language created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create language",
      });
    },
  });

  const onSubmit = (data: LanguageForm) => {
    createLanguageMutation.mutate(data);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Language</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="languageCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., en, fr, es"
                    {...field}
                    data-testid="input-language-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="languageName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., English, French, Spanish"
                    {...field}
                    data-testid="input-language-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createLanguageMutation.isPending}
              data-testid="button-create-language"
            >
              {createLanguageMutation.isPending ? "Creating..." : "Create Language"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function LanguagesManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [isCreatingLanguage, setIsCreatingLanguage] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ["/api/languages"],
  });

  const deleteLanguageMutation = useMutation({
    mutationFn: (languageId: string) => apiRequest("DELETE", `/api/languages/${languageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/languages"] });
      toast({
        title: "Success",
        description: "Language deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete language",
      });
    },
  });

  const filteredLanguages = languages.filter((language: Language) => {
    const query = searchQuery.toLowerCase();
    return (
      language.languageCode?.toLowerCase().includes(query) ||
      language.languageName?.toLowerCase().includes(query)
    );
  });

  const handleDeleteLanguage = (languageId: string) => {
    deleteLanguageMutation.mutate(languageId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Languages</h3>
            <p className="text-sm text-muted-foreground">
              Manage language configurations
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading languages...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Languages</h3>
          <p className="text-sm text-muted-foreground">
            Manage language configurations
          </p>
        </div>
        <Button
          onClick={() => setIsCreatingLanguage(true)}
          data-testid="button-create-language"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Language
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by language code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-language-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Languages List */}
      <Card>
        <CardHeader>
          <CardTitle>Languages ({filteredLanguages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LanguagesIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? "No languages match your search"
                  : "No languages found"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Language Code</TableHead>
                  <TableHead>Language Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLanguages
                  .sort((a, b) => a.languageName.localeCompare(b.languageName))
                  .map((language: Language) => (
                    <TableRow
                      key={language.id}
                      data-testid={`row-language-${language.id}`}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                            <LanguagesIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span data-testid={`text-language-code-${language.id}`}>
                            {language.languageCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-language-name-${language.id}`}>
                        {language.languageName}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLanguage(language)}
                            data-testid={`button-edit-language-${language.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                data-testid={`button-delete-language-${language.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Language</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{language.languageCode} - {language.languageName}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteLanguage(language.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  data-testid={`button-confirm-delete-language-${language.id}`}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {isCreatingLanguage && (
        <Dialog open={isCreatingLanguage} onOpenChange={setIsCreatingLanguage}>
          <LanguageCreateDialog onClose={() => setIsCreatingLanguage(false)} />
        </Dialog>
      )}

      {/* Edit Dialog */}
      {editingLanguage && (
        <Dialog open={!!editingLanguage} onOpenChange={() => setEditingLanguage(null)}>
          <LanguageEditDialog
            language={editingLanguage}
            onClose={() => setEditingLanguage(null)}
          />
        </Dialog>
      )}
    </div>
  );
}
