import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import useAuth from "../../hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      await login(values);
      navigate("/");
    } catch (error) {
      const message = error?.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white p-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            <Sparkles size={16} />
            Splitora
          </div>
          <h1 className="mt-6 text-4xl font-bold leading-tight">Split smarter, settle faster</h1>
          <p className="mt-4 text-primary-100 text-lg max-w-md">
            Track group expenses, simplify debts instantly, and keep every trip and team plan stress-free.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <Wallet className="mt-0.5" size={18} />
            <p>Auto-split expenses with equal, percentage, and custom options.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <ShieldCheck className="mt-0.5" size={18} />
            <p>Secure token-based auth and reliable activity tracking.</p>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
            <CheckCircle2 className="mt-0.5" size={18} />
            <p>Settle up quickly with smart debt simplification suggestions.</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-surface-100 p-6 sm:p-10">
        <div className="w-full max-w-md rounded-2xl bg-surface-50 p-6 sm:p-8 shadow-card border border-surface-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-surface-900">Welcome back</h2>
            <p className="mt-1 text-sm text-surface-600">Sign in to continue managing your groups.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="pointer-events-auto text-surface-500 hover:text-surface-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register("password")}
            />

            <Button type="submit" loading={isSubmitting} fullWidth>
              Log in
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-surface-600">
            New to Splitora?{" "}
            <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
