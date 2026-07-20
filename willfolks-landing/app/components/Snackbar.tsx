"use client";

interface SnackbarProps {
  message: string;
  visible: boolean;
}

export function Snackbar({ message, visible }: SnackbarProps) {
  return (
    <div
      className={`snackbar ${visible ? "snackbar--visible" : ""}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
