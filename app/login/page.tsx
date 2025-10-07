"use client";

import React from "react";
import { Input, Button } from "@heroui/react";
import { Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="relative flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="absolute top-4 right-4">
                <Link href="/">
                    <Button color="primary">Back to Viewer</Button>
                </Link>
            </div>
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg dark:bg-gray-800">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Login</h1>
                <form className="space-y-6">
                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        startContent={<Mail className="text-gray-400" />}
                    />
                    <Input
                        label="Password"
                        placeholder="Enter your password"
                        type="password"
                        startContent={<Lock className="text-gray-400" />}
                    />
          <Button color="primary" className="w-full">
            Login
          </Button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
    );
}
