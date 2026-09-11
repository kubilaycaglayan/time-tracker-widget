import TimeTracker from "./components/TimeTracker";

export default function App() {
  return (
    <div className="size-full bg-[#111118] relative">
      <div className="flex items-center justify-center h-full text-[#555566] text-sm select-none">
        Page content area
      </div>
      <TimeTracker />
    </div>
  );
}
