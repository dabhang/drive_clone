import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { verifySecret, sendEmailOTP } from "@/lib/actions/user.actions";

interface OTPModalProps {
  email: string;
  accountId: string | null;
  open: boolean;
}

const OTPModal: React.FC<OTPModalProps> = ({ email, accountId, open }) => {
  const length = 6; // length of OTP
  const [otp, setOtp] = useState(Array(length).fill(""));
  const [isOpen, setIsOpen] = useState(open);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputsRef = useRef<HTMLInputElement[]>([]);

  const router = useRouter();
  useEffect(() => {
    if (isOpen) {
      setOtp(Array(length).fill(""));
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [isOpen, length]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // only allow numbers
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // focus next input
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const sessionId = await verifySecret({
        email: email!,
        password: otp.join(""),
        accountId: accountId!,
      });
      if (sessionId) {
        router.push("/");
      }
    } catch (error) {
      console.error("OTP verification failed:", error);
    }
    setIsOpen(false);
  };

  const handleResendOtp = async () => {
    await sendEmailOTP({ email });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900/50"
      onClick={() => setIsOpen(false)} // close when clicking outside modal
    >
      <div
        className="shad-dialog bg-white"
        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
      >
        <Image
          src="/assets/icons/close-dark.svg"
          alt="close"
          width={20}
          height={20}
          onClick={() => setIsOpen(false)}
          className="otp-close-button"
        />
        <h2 className="text-h2 font-bold text-light-100 mb-2 text-center">
          Enter OTP
        </h2>
        <p className="text-light-100 text-center mb-4">
          We've sent a code to <span className="pl-1 text-brand">{email}</span>
        </p>
        <div className="shad-otp">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              name={`otp-${idx}`}
              id={`otp-${idx}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              ref={(el) => {
                inputsRef.current[idx] = el!;
              }}
              className="shad-otp-slot text-center"
            />
          ))}
        </div>
        <div className="flex justify-center w-full flex-col gap-4">
          <button
            onClick={handleSubmit}
            className="btn primary-btn w-full focus-visible:ring-0 shad-on-focus bg-brand hover:bg-brand-100 rounded-[41px] text-white py-2.5 px-4 text-[15px] h-[50px]"
          >
            Verify
          </button>
          {isLoading && (
            <Image
              src="/assets/icons/loader.svg"
              alt="loader"
              height={24}
              width={24}
              className="ml-2 animate-spin"
            />
          )}
        </div>
        <div className="subtitle-2 text-light-100 mt-4 text-center w-full">
          Didn't get a code?
          <a
            href={"#"}
            onClick={handleResendOtp}
            className="ml-1 font-medium text-brand"
          >
            {"Click to resend."}
          </a>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
