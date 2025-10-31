"use client";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { set, z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { createAccount } from "@/lib/actions/user.actions";
import OTPModal from "@/components/OTPModal";
type FormType = "sign-in" | "sign-up";

const authFormSchema = (formType: FormType) => {
  return z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .refine((val) => z.email().safeParse(val).success, {
        message: "Please enter a valid email address",
      }),

    fullName:
      formType === "sign-up"
        ? z
            .string()
            .min(2, { message: "Full name must be at least 2 characters long" })
            .max(50, {
              message: "Full name must be at most 50 characters long",
            })
        : z.string().optional(),
  });
};

const AuthForm = ({ type }: { type: FormType }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<React.ReactNode>(null);
  const [accountId, setAccountId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const user = await createAccount({
        fullName: values.fullName || "",
        email: values.email,
      });
      setAccountId(user.accountId);
    } catch (error) {
      console.error("Error creating account:", error);
      setErrorMessage("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = (otp: string) => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="auth-form">
          <h1 className="form-title h1 text-left">
            {type === "sign-in" ? "Login" : " Create Account"}
          </h1>
          {type === "sign-up" && (
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <div className="shad-form-item">
                    <FormLabel className="shad-form-label">Username</FormLabel>
                    <FormControl>
                      <Input
                        className="shad-form-input px-0 border-none shadow-none shad-on-focus focus-visible:ring-0"
                        placeholder="Enter your full name"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage className="shad-form-message" />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="shad-form-item">
                  <FormLabel className="shad-form-label">Email</FormLabel>
                  <FormControl>
                    <Input
                      className="shad-form-input shad-no-focus px-0 border-none shadow-none focus-visible:ring-0"
                      placeholder="Enter your Email"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage className="shad-form-message" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="btn primary-btn focus-visible:ring-0 shad-on-focus bg-brand hover:bg-brand-100 rounded-[41px] text-white py-2.5 px-4 text-[15px] h-[66px]"
            disabled={isLoading}
          >
            {type === "sign-in" ? "Sign In" : "Create Account"}
            {isLoading && (
              <Image
                src="/assets/icons/loader.svg"
                alt="loader"
                height={24}
                width={24}
                className="ml-2 animate-spin"
              />
            )}
          </Button>
          {errorMessage && <p className="error-message">*{errorMessage}</p>}

          <div className="body-2 flex justify-center">
            <p className="text-light-100">
              {type === "sign-in"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={type === "sign-in" ? "/sign-up" : "/sign-in"}
              className="ml-1 font-medium text-brand"
            >
              {" "}
              {type === "sign-in" ? "Sign Up" : "Sign In"}
            </Link>
          </div>
        </form>
      </Form>

      {accountId && (
        <OTPModal
          email={form.getValues("email")}
          accountId={accountId || null}
          open={true}
        />
      )}
    </>
  );
};

export default AuthForm;
