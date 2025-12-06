import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { useState } from "react";

export default function SignupScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isSchoolEmail =
    email.endsWith(".edu") ||
    email.includes("student") ||
    email.includes(".edu.sg");

  const handleSignup = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Registration failed");
      } else {
        alert("Account created! Please log in.");
      }
    } catch (err) {
      setErrorMsg("Network error");
    }

    setLoading(false);
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold mb-2">Create Account</Text>
      <Text className="text-gray-500 mb-8">Join with your school email</Text>

      <Text className="mb-1 font-medium">Full Name</Text>
      <TextInput
        placeholder="John Tan"
        className="border rounded-xl px-4 py-3 mb-4"
        value={fullName}
        onChangeText={setFullName}
      />

      <Text className="mb-1 font-medium">School Email</Text>
      <TextInput
        placeholder="name@student.school.edu"
        className={`border rounded-xl px-4 py-3 mb-1 ${
          email.length > 0 && !isSchoolEmail ? "border-red-500" : ""
        }`}
        value={email}
        onChangeText={setEmail}
      />

      {email.length > 0 && !isSchoolEmail && (
        <Text className="text-red-500 mb-4">
          Only valid school emails are allowed.
        </Text>
      )}

      <Text className="mb-1 font-medium">Password</Text>
      <TextInput
        placeholder="••••••••"
        secureTextEntry
        className="border rounded-xl px-4 py-3 mb-6"
        value={password}
        onChangeText={setPassword}
      />

      {errorMsg.length > 0 && (
        <Text className="text-red-500 text-center mb-4">{errorMsg}</Text>
      )}

      <TouchableOpacity
        disabled={!isSchoolEmail || loading}
        onPress={handleSignup}
        className={`py-4 rounded-xl mb-4 ${
          isSchoolEmail ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? "Creating..." : "Sign Up"}
        </Text>
      </TouchableOpacity>

      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-500">Already have an account? </Text>
        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text className="text-blue-600 font-semibold">Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
