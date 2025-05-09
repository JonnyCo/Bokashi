import { motion } from "framer-motion";
import { Leaf, Menu, X } from "lucide-react";
import { Link } from "react-router";
import { Button } from "./ui/button";
import { useState } from "react";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navItems = [
    { href: "/#research", label: "Research" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#data", label: "Data" },
    { href: "/#team", label: "Team" },
  ];

  return (
    <header className=" sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between py-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: 0 }}
          >
            <Leaf className="h-6 w-6 text-emerald-600" />
          </motion.div>
          <Link to="/">
            <span className="text-xl font-bold">FoodCam2Farm</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-sm font-medium hover:text-emerald-600 transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/dashboard"
            className="text-sm font-medium hover:text-emerald-600 transition-colors"
          >
            Dashboard
          </a>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-gray-700 hover:text-emerald-600 transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden bg-white border-b"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="container max-w-7xl mx-auto py-4 px-6 flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="text-base font-medium py-2 hover:text-emerald-600 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/dashboard"
              className="text-base font-medium py-2 hover:text-emerald-600 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </a>
            <Button className="bg-emerald-600 hover:bg-emerald-700 transition-colors duration-300 mt-2">
              Join Research
            </Button>
          </div>
        </motion.div>
      )}
    </header>
  );
}
