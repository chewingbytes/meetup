import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please fill in both email and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Login Failed", data.error || "Invalid email or password.");
        return;
      }

      Alert.alert("Success", "Logged in!");

      console.log("User Login Data:", data);

      // TODO: Save token to SecureStore
      // TODO: Redirect to home screen
    } catch (err) {
      Alert.alert("Error", "Could not connect to server.");
      console.log("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      <Text className="text-3xl font-bold mb-2">Welcome Back</Text>
      <Text className="text-gray-500 mb-8">Login to your account</Text>

      {/* Email */}
      <Text className="mb-1 font-medium">Email</Text>
      <TextInput
        placeholder="name@student.school.edu"
        className="border rounded-xl px-4 py-3 mb-4"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      {/* Password */}
      <Text className="mb-1 font-medium">Password</Text>
      <TextInput
        placeholder="••••••••"
        secureTextEntry
        className="border rounded-xl px-4 py-3 mb-2"
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity className="mb-6">
        <Text className="text-blue-600 text-right">Forgot Password?</Text>
      </TouchableOpacity>

      {/* LOGIN BUTTON */}
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className={`bg-blue-600 py-4 rounded-xl mb-4 ${loading ? "opacity-50" : ""}`}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>

      <Text className="text-center my-4 text-gray-500">or</Text>

      {/* SINGPASS */}
      <Link href="/singpass-login" asChild>
        <TouchableOpacity className="flex-row items-center justify-center border py-4 rounded-xl">
          <Image
            source={{
              uri: "https://www.singpass.gov.sg/images/singpass-icon.svg",
            }}
            className="w-6 h-6 mr-2"
          />
          <Text className="font-medium">Login with Singpass</Text>
        </TouchableOpacity>
      </Link>

      {/* SIGNUP LINK */}
      <View className="flex-row justify-center mt-8">
        <Text className="text-gray-500">Don’t have an account? </Text>
        <Link href="/register" asChild>
          <TouchableOpacity>
            <Text className="text-blue-600 font-semibold">Sign Up</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}
