"use client";

import { useRef, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CreateUserFormValues } from "@/types";
import { createUserSchema } from "@/types";
import { cn, uploadFileToServer } from "@/lib/utils";

const CLOUDINARY_CLOUD_NAME = "dyk7nqgkv";
const CLOUDINARY_UPLOAD_PRESET = "openchatAI";

interface CreateUserFormProps {
  isSubmitting: boolean;
  onSubmit: (values: CreateUserFormValues) => Promise<void>;
  onCancel?: () => void;
}

export default function CreateUserForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: CreateUserFormProps) {
  const { toast } = useToast();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      region: "",
      gender: undefined,
      age: undefined,
      profile_picture: "",
    },
  });

  // const handleProfilePictureUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   setIsUploadingImage(true);
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  //   try {
  //     const response = await fetch(
  //       `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  //     const dataRes = await response.json();
  //     if (dataRes.secure_url) {
  //       form.setValue("profile_picture", dataRes.secure_url, {
  //         shouldDirty: true,
  //         shouldValidate: true,
  //       });
  //       toast({
  //         title: "Profile Picture Uploaded",
  //         description: "The image is ready to be saved with the new user.",
  //       });
  //     } else {
  //       throw new Error(dataRes.error?.message || "Cloudinary upload failed");
  //     }
  //   } catch (error: any) {
  //     toast({
  //       title: "Upload Failed",
  //       description: error.message || "Could not upload profile picture.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploadingImage(false);
  //     if (profilePictureInputRef.current) {
  //       profilePictureInputRef.current.value = "";
  //     }
  //   }
  // };

  const handleProfilePictureUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsUploadingImage(true);

  try {
    // Call your reusable internal upload function
    const uploadedUrl = await uploadFileToServer(file, "profilepicture");

    // Set the form value with uploaded URL
    form.setValue("profile_picture", uploadedUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });

    toast({
      title: "Profile Picture Uploaded",
      description: "The image is ready to be saved with the new user.",
    });
  } catch (error: any) {
    toast({
      title: "Upload Failed",
      description: error.message || "Could not upload profile picture.",
      variant: "destructive",
    });
  } finally {
    setIsUploadingImage(false);
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    }
  }
};


  const handleSubmit: SubmitHandler<CreateUserFormValues> = async (data) => {
    await onSubmit(data);
  };

  const isButtonDisabled = isSubmitting || isUploadingImage;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender (Optional)</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="30"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., USA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormItem>
          <FormLabel>Profile Picture (Optional)</FormLabel>
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:border-primary transition",
              isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            )}
            onClick={() => profilePictureInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragging(false);

              const file = e.dataTransfer.files?.[0];
              if (!file) return;

              const fakeEvent = {
                target: { files: [file] },
              } as unknown as React.ChangeEvent<HTMLInputElement>;

              await handleProfilePictureUpload(fakeEvent);
            }}
          >
            <Input
              id="profilePictureInput"
              type="file"
              accept="image/*"
              className="hidden"
              ref={profilePictureInputRef}
              onChange={handleProfilePictureUpload}
              disabled={isUploadingImage || isButtonDisabled}
            />

            {/* While uploading */}
            {isUploadingImage && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}

            {/* If no profile picture yet */}
            {!form.watch("profile_picture") && !isUploadingImage && (
              <>
                <UploadCloud className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  Drag & drop an image here, or click to upload
                </span>
              </>
            )}

            {/* If profile picture exists */}
            {form.watch("profile_picture") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.watch("profile_picture")}
                alt="Profile Preview"
                className="h-20 w-20 rounded-full border object-cover"
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="profile_picture"
            render={({ field }) => (
              <>
                <FormControl>
                  <input type="hidden" {...field} />
                </FormControl>
                <FormMessage />
              </>
            )}
          />
        </FormItem>

        <div className="flex justify-end space-x-3 pt-4">
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
            {isSubmitting ? "Creating User..." : "Create User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
