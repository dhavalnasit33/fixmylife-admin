"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageHeader from "@/components/shared/PageHeader";
import ProtectedPage from "@/components/shared/ProtectedPage";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/lib/apiService";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, Loader2 } from "lucide-react";
import ClientFormattedDate from "@/components/shared/ClientFormattedDate";
import { Skeleton } from "@/components/ui/skeleton";
import { uploadFileToServer } from "@/lib/utils";

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  profile_picture: z
    .string()
    .url({ message: "Invalid URL for profile picture" })
    .optional()
    .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, { message: "Current password is required" }),
    newPassword: z
      .string()
      .min(6, { message: "New password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

const CLOUDINARY_CLOUD_NAME = "dyk7nqgkv";
const CLOUDINARY_UPLOAD_PRESET = "openchatAI";

export default function ProfilePage() {
  const { user, updateUserProfile, loading: authLoading } = useAuth(); // Removed fetchCurrentUser as updateUserProfile handles it
  const { toast } = useToast();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const profilePictureInputRef = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      profile_picture: "",
    },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || "",
        profile_picture: user.profile_picture || "",
      });
    }
  }, [user, profileForm.reset]);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleProfileUpdate: SubmitHandler<ProfileFormValues> = async (
    data
  ) => {
    setIsUpdatingProfile(true);
    try {
      await updateUserProfile(data);
      // updateUserProfile in AuthContext now shows toast and fetches current user
    } catch (error) {
      // Error is handled by updateUserProfile if it re-throws, or toast is shown there.
      // If updateUserProfile doesn't re-throw, this console.error is useful for debugging.
      console.error("Profile update failed on page:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleProfilePictureDrop = async (
    e: React.DragEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProfilePictureUpload({ target: { files: [file] } } as any);
    }
  };

  const handlePasswordChange: SubmitHandler<PasswordFormValues> = async (
    data
  ) => {
    setIsUpdatingPassword(true);
    try {
      await apiService("/auth/change-password", {
        method: "PUT",
        body: {
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        } as any,
      });
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      passwordForm.reset();
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "Could not update password.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // const handleProfilePictureUpload = async (
  //   event: React.ChangeEvent<HTMLInputElement>
  // ) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   setIsUploadingImage(true);
  //   const formData = new FormData();
  //   formData.append("file", file);
  //   formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET); // Using 'fixmylife'

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
  //       profileForm.setValue("profile_picture", dataRes.secure_url, {
  //         shouldDirty: true,
  //       });
  //       await updateUserProfile({ profile_picture: dataRes.secure_url });
  //       // updateUserProfile in AuthContext should handle success toast & refetching user.
  //       // Explicit toast here can be redundant but confirms image-specific upload success.
  //       toast({
  //         title: "Profile Picture Updated",
  //         description: "Your new profile picture is processing.",
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
  // }; // End of handleProfilePictureUpload function

 const handleProfilePictureUpload = async (
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  setIsUploadingImage(true);

  try {
    // ✅ Use reusable upload function
    const url = await uploadFileToServer(file, "profilepicture");

    // Update form field
    profileForm.setValue("profile_picture", url, {
      shouldDirty: true,
      shouldValidate: true,
    });

    // Call your profile update API
    await updateUserProfile({ profile_picture: url });

    toast({
      title: "Profile Picture Updated",
      description: "Your new profile picture is uploaded successfully.",
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


  if (authLoading || !user) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full rounded-lg" />
          <Skeleton className="md:col-span-2 h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  } // End of the conditional return block for loading state

  return (
    <ProtectedPage>
      <PageHeader
        title="My Profile"
        description="Manage your personal information and security settings."
      />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-lg">
          <CardHeader className="items-center text-center">
            <div
              className="relative group rounded-full p-2"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleProfilePictureDrop}
            >
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={user.profile_picture || ""} alt={user.name} />
                <AvatarFallback className="text-4xl">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Upload button */}
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-background/80 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={() => profilePictureInputRef.current?.click()}
                disabled={isUploadingImage}
                aria-label="Upload new profile picture"
              >
                {isUploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud size={16} />
                )}
              </Button>
            </div>

            <Input
              id="profilePictureInput"
              type="file"
              accept="image/*"
              className="hidden"
              ref={profilePictureInputRef}
              onChange={handleProfilePictureUpload}
              disabled={isUploadingImage}
            />
            <CardTitle className="text-2xl font-headline mt-4">
              {user.name}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div className="flex justify-between">
              <span>Plan:</span>{" "}
              <span className="font-medium text-foreground">{user.plan}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>{" "}
              <span className="font-medium text-foreground capitalize">
                {user.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tokens:</span>{" "}
              <span className="font-medium text-foreground">
                {user.remaining_tokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Age:</span>{" "}
              <span className="font-medium text-foreground">
                {user.age || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Region:</span>{" "}
              <span className="font-medium text-foreground">
                {user.region || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Gender:</span>{" "}
              <span className="font-medium text-foreground">
                {user.gender || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Roles:</span>{" "}
              <span className="font-medium text-foreground">
                {user.roles.join(", ")}
              </span>
            </div>
            {user.lastLogin && (
              <div className="flex justify-between">
                <span>Last Login:</span>
                <ClientFormattedDate
                  dateInput={user.lastLogin}
                  className="font-medium text-foreground"
                  fallback="Loading..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Account Settings</CardTitle>
            <CardDescription>
              Update your name or change your password. Profile picture is
              updated directly via upload button.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                className="space-y-6"
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="profile_picture"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>Profile Picture URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={
                    isUpdatingProfile || authLoading || isUploadingImage
                  }
                  className="w-full sm:w-auto"
                >
                  {isUpdatingProfile ? "Saving..." : "Save Name Changes"}
                </Button>
              </form>
            </Form>

            <Separator className="my-8" />

            <h3 className="text-lg font-medium font-headline mb-1">
              Change Password
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ensure your account is using a long, random password to stay
              secure.
            </p>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(handlePasswordChange)}
                className="space-y-6"
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={isUpdatingPassword || authLoading}
                  className="w-full sm:w-auto"
                >
                  {isUpdatingPassword ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedPage>
  );
}
