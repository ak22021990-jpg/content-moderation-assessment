export default function SpamIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="7" width="18" height="12" rx="2" />
      <path d="m3 7 9 6 9-6" />
      <path d="M9 4h6" />
      <path d="M12 2v4" />
      <path d="M12 22v-2" />
    </svg>
  )
}
