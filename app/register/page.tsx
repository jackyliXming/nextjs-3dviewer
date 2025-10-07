"use client";

import React from "react";
import { Input, Button } from "@heroui/react";
import { Mail, Lock, User } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="absolute top-4 right-4">
        <Link href="/">
          <Button color="primary">Back to Viewer</Button>
        </Link>
      </div>
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Create an Account</h1>
        <form className="space-y-6">
          <Input
            label="Username"
            placeholder="Choose a username"
            startContent={<User className="text-gray-400" />}
          />
          <Input
            label="Email"
            placeholder="Enter your email"
            startContent={<Mail className="text-gray-400" />}
          />
          <Input
            label="Password"
            placeholder="Create a password"
            type="password"
            startContent={<Lock className="text-gray-400" />}
          />
          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            type="password"
            startContent={<Lock className="text-gray-400" />}
          />
          <Button color="primary" className="w-full">
            Register
          </Button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
