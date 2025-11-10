import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Languages as LanguagesIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CultureCode {
  cultureCode: string;
  cultureName: string;
  cultureNameEnglish: string;
  numberThousandsSeparator: string;
  numberDecimalSeparator: string;
  dateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  defaultTimePresentation: string;
  nameOrder: string;
  fallBackCultureLanguage: string;
}

export default function LanguagesManagement() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cultureCodes = [], isLoading } = useQuery<CultureCode[]>({
    queryKey: ["/api/universal/culture-codes"],
  });

  const filteredCultureCodes = cultureCodes.filter((culture: CultureCode) => {
    const query = searchQuery.toLowerCase();
    return (
      culture.cultureCode?.toLowerCase().includes(query) ||
      culture.cultureName?.toLowerCase().includes(query) ||
      culture.cultureNameEnglish?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Culture Codes / Languages</h3>
            <p className="text-sm text-muted-foreground">
              View available culture codes and language configurations
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="animate-pulse">Loading culture codes...</div>
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
          <h3 className="text-lg font-semibold">Culture Codes / Languages</h3>
          <p className="text-sm text-muted-foreground">
            View available culture codes and language configurations
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by culture code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-culture-search"
            />
          </div>
        </CardContent>
      </Card>

      {/* Culture Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>Culture Codes ({filteredCultureCodes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCultureCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LanguagesIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>
                {searchQuery
                  ? "No culture codes match your search"
                  : "No culture codes found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Culture Code</TableHead>
                    <TableHead>Culture Name</TableHead>
                    <TableHead>English Name</TableHead>
                    <TableHead>Number Format</TableHead>
                    <TableHead>Date Format</TableHead>
                    <TableHead>Time Format</TableHead>
                    <TableHead>Time Presentation</TableHead>
                    <TableHead>Name Order</TableHead>
                    <TableHead>Fallback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCultureCodes
                    .sort((a, b) => a.cultureCode.localeCompare(b.cultureCode))
                    .map((culture: CultureCode) => (
                      <TableRow
                        key={culture.cultureCode}
                        data-testid={`row-culture-${culture.cultureCode}`}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <LanguagesIcon className="h-4 w-4 text-primary" />
                            </div>
                            <span data-testid={`text-culture-code-${culture.cultureCode}`}>
                              {culture.cultureCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-culture-name-${culture.cultureCode}`}>
                          {culture.cultureName}
                        </TableCell>
                        <TableCell data-testid={`text-culture-name-english-${culture.cultureCode}`}>
                          {culture.cultureNameEnglish}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">
                            1{culture.numberThousandsSeparator}000{culture.numberDecimalSeparator}00
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{culture.dateFormat}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{culture.timeFormat}</span>
                        </TableCell>
                        <TableCell>{culture.defaultTimePresentation}</TableCell>
                        <TableCell>{culture.nameOrder}</TableCell>
                        <TableCell className="text-xs">{culture.fallBackCultureLanguage}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
