// app/components/ui/Button.tsx

interface ButtonProps {
  onClick: () => void;
  isOpen: boolean;
  children?: React.ReactNode;
}

export default function Button({ onClick, isOpen }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group mt-8 px-6 py-2.5 bg-transparent hover:bg-gray-50 text-gray-500 hover:text-gray-700 rounded-full transition-all duration-300 text-sm font-medium"
    >
      <span className="flex items-center gap-2">
        {isOpen ? "READ LESS" : "READ MORE"}
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </button>
  );
}