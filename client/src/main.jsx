import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			refetchOnWindowFocus: false,
			retry: 1,
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />

			<Toaster
				position="top-right"
				toastOptions={{
					duration: 3500,
					style: {
						borderRadius: "12px",
						background: "#ffffff",
						color: "#0f172a",
						border: "1px solid #e2e8f0",
						boxShadow: "0 8px 24px rgba(2, 6, 23, 0.08)",
						fontSize: "14px",
						padding: "12px 14px",
					},
					success: {
						style: {
							border: "1px solid #bbf7d0",
							background: "#f0fdf4",
						},
					},
					error: {
						style: {
							border: "1px solid #fecaca",
							background: "#fef2f2",
						},
					},
				}}
			/>

			{import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
		</QueryClientProvider>
	</React.StrictMode>
);
