import { Leaf } from "lucide-react";
import { Link } from "react-router";

export default function Footer() {
  return (
    <footer className="border-t bg-emerald-50">
      <div className="container flex flex-col gap-6 py-8 md:py-12 mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-emerald-600" />
              <span className="text-xl font-bold">FoodCam2Farm</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-[300px]">
              A research project exploring closed-loop systems for transforming
              food waste into autonomous food production.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
            <div className="flex flex-col gap-3">
              <div className="font-medium">Research</div>
              <nav className="flex flex-col gap-2">
                <Link to="#research" className="text-sm hover:underline">
                  Research
                </Link>
                <Link to="#how-it-works" className="text-sm hover:underline">
                  How it works
                </Link>
                <Link to="#data" className="text-sm hover:underline">
                  Data
                </Link>
                <Link to="#team" className="text-sm hover:underline">
                  Team
                </Link>
              </nav>
            </div>
            <div className="flex flex-col gap-3">
              <div className="font-medium">Project</div>
              <nav className="flex flex-col gap-2">
                <Link to="#about" className="text-sm hover:underline">
                  About
                </Link>
                <Link to="#team" className="text-sm hover:underline">
                  Team
                </Link>
              </nav>
            </div>
            {/* <div className="flex flex-col gap-3">
              <div className="font-medium">Connect</div>
              <nav className="flex flex-col gap-2">
                <Link to="#" className="text-sm hover:underline">
                  Twitter
                </Link>
                <Link to="#" className="text-sm hover:underline">
                  GitHub
                </Link>
                <Link to="#" className="text-sm hover:underline">
                  ResearchGate
                </Link>
                <Link to="#" className="text-sm hover:underline">
                  Contact
                </Link>
              </nav>
            </div> */}
          </div>
        </div>
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} FoodCam2Farm Research Project. All
            rights reserved.
          </p>
          <nav className="flex gap-4">
            <Link
              to="#"
              className="text-xs text-muted-foreground hover:underline"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-xs text-muted-foreground hover:underline"
            >
              Terms of Use
            </Link>
            <Link
              to="#"
              className="text-xs text-muted-foreground hover:underline"
            >
              Open Source
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
