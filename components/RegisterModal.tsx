"use client";

import React from "react";
import { Input, Button } from "@heroui/react";
import { Mail, Lock, User, X } from "lucide-react";

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  return (
    <div className="fixed inset-0 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg dark:bg-gray-800 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={24} />
        </button>
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
          <div className="flex items-center justify-center">
            <hr className="w-full border-gray-300 dark:border-gray-600" />
            <span className="px-2 text-gray-500 dark:text-gray-400">OR</span>
            <hr className="w-full border-gray-300 dark:border-gray-600" />
          </div>
          <Button className="w-full bg-white text-black border border-gray-300 hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 8.841C34.553 4.806 29.613 2.5 24 2.5 11.418 2.5 2.5 11.418 2.5 24s8.918 21.5 21.5 21.5S45.5 36.582 45.5 24c0-1.582-.146-3.117-.409-4.583z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039L38.804 8.841C34.553 4.806 29.613 2.5 24 2.5 16.318 2.5 9.646 6.934 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 45.5c5.613 0 10.553-2.306 14.804-6.196l-6.571-4.819c-1.903 1.436-4.235 2.316-6.824 2.316-5.223 0-9.651-3.657-11.303-8.316l-6.571 4.82C9.646 38.566 16.318 45.5 24 45.5z" />
              <path fill="#1976D2" d="M43.611 20.083H24v8h11.303c-.792 2.237-2.231 4.16-4.082 5.581l6.571 4.819c3.937-3.627 6.487-8.875 6.487-14.819 0-1.582-.146-3.117-.409-4.583z" />
            </svg>
            Sign up with Google
          </Button>
        </form>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="font-medium text-blue-600 hover:underline dark:text-blue-500">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
