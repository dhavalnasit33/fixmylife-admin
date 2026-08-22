"use client";

import { useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  CreateUserFormValues,
  UserUpdateFormValues,
  Plan,
  FormValues,
  EditUserFormValues,
} from "@/types";
import { ALL_ROLES_ARRAY, ALL_PLANS_ARRAY, Role } from "@/config";
import { userFormSchema, editUserSchema } from "@/types"; // Adjust if you use a merged schema

const CLOUDINARY_CLOUD_NAME = "dyk7nqgkv";
const CLOUDINARY_UPLOAD_PRESET = "openchatAI";

interface UserFormProps {
  isSubmitting: boolean;
  onSubmit: (values: FormValues | EditUserFormValues) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<FormValues | EditUserFormValues>;
  availablePlans?: Plan[];
  isEditMode?: boolean;
}

export default function UserForm({
  isSubmitting,
  onSubmit,
  onCancel,
  initialData,
  availablePlans,
  isEditMode = false,
}: UserFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);

  // Use different schema based on whether we're editing or creating
  const schema = isEditMode ? editUserSchema : userFormSchema;

  const form = useForm<FormValues | EditUserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      region: "",
      gender: undefined,
      age: undefined,
      profile_picture: "",
      name: "",
     roles: initialData?.roles?.length ? initialData.roles : ["User"],
      plan: availablePlans?.[0]?.name || "",
      remaining_tokens: 0,
      ...initialData,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...form.getValues(),
        ...initialData,
                roles: initialData.roles?.length ? initialData.roles : ["User"],

      });
    }
  }, [initialData]);

  const profilePicture = form.watch("profile_picture");

  const plansToUse = availablePlans?.length
    ? availablePlans
    : (ALL_PLANS_ARRAY.map((name) => ({ name, display_name: name })) as Plan[]);

  const handleSubmit = async (data: FormValues | EditUserFormValues) => {
    await onSubmit(data);
  };

  const isButtonDisabled = isSubmitting || isUploadingImage;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* First + Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email & Password */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              {isEditMode && (
                <FormDescription>
                  Leave empty to keep the current password unchanged
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gender, Age, Region */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => {
              const { value, ...restField } = field;
              return (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" value={value ?? ""} {...restField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., USA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Profile Picture Upload */}
        {/* <FormItem>
          <FormLabel>Profile Picture</FormLabel>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              ref={profilePictureInputRef}
              className="hidden"
              onChange={handleProfilePictureUpload}
              disabled={isButtonDisabled}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => profilePictureInputRef.current?.click()}
              disabled={isButtonDisabled}
            >
              {isUploadingImage ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UploadCloud className="w-4 h-4 mr-2" />
              )}
              Upload Image
            </Button>
            {profilePicture && (
              <img
                src={profilePicture}
                alt="Preview"
                className="h-12 w-12 rounded-full object-cover border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-profile.png'; // fallback image if broken
                }}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="profile_picture"
            render={({ field }) => <input type="hidden" {...field} />}
          />
        </FormItem> */}

        {/* Roles */}
        {/* <FormField
          control={form.control}
          name="roles"
          render={() => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Controller
                control={form.control}
                name="roles"
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => field.onChange([value as Role])}
                    value={field.value?.[0] || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_ROLES_ARRAY.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FormMessage />
            </FormItem>
          )}
        /> */}

        {/* Plan */}
        <FormField
          control={form.control}
          name="plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plan</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {plansToUse.map((plan) => (
                    <SelectItem key={plan.name} value={plan.name}>
                      {plan.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Remaining Tokens */}
        <FormField
  control={form.control}
  name="remaining_tokens"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Remaining Tokens</FormLabel>
      <FormControl>
        <Input
          type="number"
          min={0}
          value={field.value ?? ""}
          onChange={(e) => {
            // Allow empty string for better UX when typing
            field.onChange(e.target.value === "" ? "" : e.target.value);
          }}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>


        {/* Buttons */}
        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isButtonDisabled}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isButtonDisabled}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : initialData ? (
              "Save Changes"
            ) : (
              "Create User"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
