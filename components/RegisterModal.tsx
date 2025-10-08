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
