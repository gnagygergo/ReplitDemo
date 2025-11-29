/**
 * layoutDependencies.ts
 * 
 * PURPOSE:
 * This is a centralized bundle of all components, hooks, utilities, and icons
 * that layout files might need. Instead of each layout file importing 20+ items
 * individually, they receive this pre-bundled dependency object.
 * 
 * BENEFITS:
 * 1. Reduces import clutter in layout files (from ~20 lines to ~1 line)
 * 2. Ensures consistent imports across all layouts
 * 3. Makes it easy to add new dependencies in one place
 * 4. Simplifies layout file refactoring
 * 
 * HOW IT WORKS:
 * The ObjectDetailPage and ObjectListPage wrapper components import this bundle
 * and pass it to the dynamically loaded layout via props. Layouts access
 * components like: deps.components.Button, deps.icons.Edit, deps.hooks.useToast
 * 
 * PATTERN:
 * This follows the "Dependency Injection" pattern - instead of layouts
 * reaching out for their dependencies (imports), dependencies are
 * "injected" into them via props.
 * 
 * USAGE IN LAYOUTS:
 * // Old way (many imports):
 * import { Button } from "@/components/ui/button";
 * import { Card } from "@/components/ui/card";
 * import { Edit, Save } from "lucide-react";
 * // ... 15 more imports
 * 
 * // New way (single prop):
 * export default function AssetDetail({ deps }: { deps: LayoutDependencies }) {
 *   const { Button, Card } = deps.components;
 *   const { Edit, Save } = deps.icons;
 * }
 */

// ============================================================================
// UI COMPONENT IMPORTS
// Core UI components from shadcn/ui
// ============================================================================

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// FIELD COMPONENT IMPORTS
// Custom field components for form rendering
// ============================================================================

import { TextField } from "@/components/ui/text-field";
import { NumberField } from "@/components/ui/number-field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { AddressField } from "@/components/ui/address-field";
import { CheckboxField } from "@/components/ui/checkbox-field";
import LookupFormField from "@/components/ui/lookup-form-field";
import { DropDownListField } from "@/components/ui/dropdown-list-field";

// ============================================================================
// PANEL COMPONENTS
// For resizable layouts
// ============================================================================

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// ============================================================================
// ICON IMPORTS
// Commonly used icons from lucide-react
// ============================================================================

import {
  // Navigation & Actions
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  
  // Objects & Items
  Package,
  Building,
  User,
  Users,
  FileText,
  File,
  Folder,
  FolderOpen,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  
  // Status & Feedback
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Loader2,
  RefreshCw,
  
  // Misc
  Settings,
  Filter,
  Download,
  Upload,
  Copy,
  Link as LinkIcon,
  Star,
  Heart,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================================================
// ROUTING IMPORTS
// For navigation within layouts
// ============================================================================

import { Link, useLocation, useRoute } from "wouter";

// ============================================================================
// HOOK IMPORTS
// Custom hooks and React Query hooks
// ============================================================================

import { useToast } from "@/hooks/use-toast";
import { useObjectDetail } from "@/hooks/useObjectDetail";
import { useObjectList, useSortDirection } from "@/hooks/useObjectList";
import { useObjectFieldTypes } from "@/hooks/use-object-field-types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// ============================================================================
// UTILITY IMPORTS
// Helper functions and utilities
// ============================================================================

import { apiRequest, queryClient } from "@/lib/queryClient";
import { format, formatDistance, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { toSingular, toPlural, getSingularLabel, getPluralLabel, capitalize } from "@/lib/pluralize";

// ============================================================================
// REACT IMPORTS
// Core React hooks that layouts might need
// ============================================================================

import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * The main LayoutDependencies type.
 * This defines all the pre-bundled dependencies available to layouts.
 */
export interface LayoutDependencies {
  /** Core UI components (Button, Card, Table, Form, etc.) */
  components: typeof components;
  
  /** Field components for rendering form fields */
  fields: typeof fields;
  
  /** Panel components for resizable layouts */
  panels: typeof panels;
  
  /** Lucide icons */
  icons: typeof icons;
  
  /** Routing utilities (Link, useLocation, useRoute) */
  routing: typeof routing;
  
  /** Custom hooks (useToast, useObjectDetail, etc.) */
  hooks: typeof hooks;
  
  /** Utility functions and libraries */
  utils: typeof utils;
  
  /** React core hooks */
  react: typeof reactHooks;
}

// ============================================================================
// BUNDLED EXPORTS
// Group related items together for easy access
// ============================================================================

/**
 * Core UI components bundle
 */
export const components = {
  // Basic elements
  Button,
  Input,
  Label,
  Badge,
  Skeleton,
  Separator,
  Checkbox,
  Textarea,
  ScrollArea,
  
  // Card components
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  
  // Table components
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  
  // Form components
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  
  // Dialog components
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  
  // Select components
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  
  // Tabs components
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  
  // Tooltip components
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
};

/**
 * Field components bundle
 */
export const fields = {
  TextField,
  NumberField,
  DateTimeField,
  AddressField,
  CheckboxField,
  LookupFormField,
  DropDownListField,
};

/**
 * Panel components bundle
 */
export const panels = {
  Panel,
  PanelGroup,
  PanelResizeHandle,
};

/**
 * Icons bundle
 */
export const icons = {
  // Navigation & Actions
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal,
  MoreVertical,
  ExternalLink,
  
  // Objects & Items
  Package,
  Building,
  User,
  Users,
  FileText,
  File,
  Folder,
  FolderOpen,
  Calendar,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  
  // Status & Feedback
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  Loader2,
  RefreshCw,
  
  // Misc
  Settings,
  Filter,
  Download,
  Upload,
  Copy,
  LinkIcon,
  Star,
  Heart,
  Eye,
  EyeOff,
};

/**
 * Routing utilities bundle
 */
export const routing = {
  Link,
  useLocation,
  useRoute,
};

/**
 * Hooks bundle
 */
export const hooks = {
  // Custom hooks
  useToast,
  useObjectDetail,
  useObjectList,
  useSortDirection,
  useObjectFieldTypes,
  
  // React Query hooks
  useQuery,
  useMutation,
  useQueryClient,
  
  // Form hooks
  useForm,
  zodResolver,
};

/**
 * Utilities bundle
 */
export const utils = {
  // API utilities
  apiRequest,
  queryClient,
  
  // Date utilities
  format,
  formatDistance,
  parseISO,
  
  // CSS utilities
  cn,
  
  // Validation
  z,
  
  // Pluralization utilities (for irregular plurals like 'opportunities' -> 'opportunity')
  toSingular,
  toPlural,
  getSingularLabel,
  getPluralLabel,
  capitalize,
};

/**
 * React hooks bundle
 */
export const reactHooks = {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
};

// ============================================================================
// MAIN BUNDLE EXPORT
// The complete dependencies object passed to layouts
// ============================================================================

/**
 * The complete layout dependencies bundle.
 * This is what gets passed to every layout component.
 */
export const layoutDependencies: LayoutDependencies = {
  components,
  fields,
  panels,
  icons,
  routing,
  hooks,
  utils,
  react: reactHooks,
};

/**
 * Default export for convenience
 */
export default layoutDependencies;
