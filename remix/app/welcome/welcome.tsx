import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

import {
  Leaf,
  Recycle,
  ChevronRight,
  ArrowRight,
  Globe,
  Sprout,
  Thermometer,
  Droplets,
  Wind,
  LineChart,
  Gauge,
  BotIcon as Robot,
  Microscope,
  Rocket,
  Github,
  Linkedin,
  Twitter,
  ChevronDown,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@radix-ui/react-accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Link } from "react-router";
import allen from "./allen.jpg";
import shunying from "./shunying.jpg";
import jessica from "./jessica.jpg";
import jonny from "./jonny.jpg";
import kye from "./kye.jpg";
import anson from "./anson.jpg";
import lauren from "./lauren.jpg";
import Footer from "~/components/Footer";
import Header from "~/components/Header";

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const [chartData, setChartData] = useState<
    Array<{ day: number; co2: number; temperature: number; moisture: number }>
  >([]);

  // Generate mock sensor data for visualization
  useEffect(() => {
    const generateData = () => {
      const days = 14;
      const data = [];

      for (let i = 0; i < days; i++) {
        // Create realistic-looking fermentation data patterns
        const co2 = 400 + Math.sin(i / 2) * 200 + i * 50 + Math.random() * 50;
        const temp = 22 + Math.sin(i / 3) * 4 + Math.random() * 0.5;
        const moisture = 70 - i * 2 + Math.sin(i) * 5 + Math.random() * 3;

        data.push({
          day: i + 1,
          co2: co2,
          temperature: temp,
          moisture: moisture,
        });
      }

      setChartData(data);
    };

    generateData();
  }, []);

  // Handle scroll events for parallax and animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Draw chart when data is available
  useEffect(() => {
    if (chartData.length > 0 && chartRef.current) {
      const canvas = chartRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;

      // Vertical grid lines (days)
      for (let i = 0; i <= chartData.length; i++) {
        const x = (i / chartData.length) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = (i / 5) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw CO2 line
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();

      chartData.forEach((point, index) => {
        const x = (index / (chartData.length - 1)) * width;
        // Normalize CO2 values to fit in the canvas
        const normalizedCO2 = 1 - (point.co2 - 400) / 1200;
        const y = normalizedCO2 * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw temperature line
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();

      chartData.forEach((point, index) => {
        const x = (index / (chartData.length - 1)) * width;
        // Normalize temperature values
        const normalizedTemp = 1 - (point.temperature - 18) / 10;
        const y = normalizedTemp * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw moisture line
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();

      chartData.forEach((point, index) => {
        const x = (index / (chartData.length - 1)) * width;
        // Normalize moisture values
        const normalizedMoisture = 1 - point.moisture / 100;
        const y = normalizedMoisture * height;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Add legend
      ctx.font = "12px Arial";

      ctx.fillStyle = "#10b981";
      ctx.fillRect(width - 120, 10, 10, 10);
      ctx.fillStyle = "#000";
      ctx.fillText("CO₂ (ppm)", width - 105, 19);

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(width - 120, 30, 10, 10);
      ctx.fillStyle = "#000";
      ctx.fillText("Temp (°C)", width - 105, 39);

      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(width - 120, 50, 10, 10);
      ctx.fillStyle = "#000";
      ctx.fillText("Moisture (%)", width - 105, 59);
    }
  }, [chartData]);

  // Animation variants for Framer Motion
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const iconAnimation = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  // Team members data
  const teamMembers = [
    {
      name: "Allen Song",
      role: "Lead Machine Learning Engineer",
      bio: "Specializing in machine learning applications for environmental systems, developing models to optimize the Bokashi fermentation process.",
      image: allen,
    },
    {
      name: "Jonny Cohen",
      role: "Robotics Engineer",
      bio: "Robotics and automation expert focused on developing the CNC garden system and sensor integration for closed-loop agricultural systems.",
      image: jonny,
    },
    {
      name: "Kye Shimizu",
      role: "Fullstack Engineer",
      bio: "Developing the serverside integration and data infrastructure to connect all components of the system into a unified platform.",
      image: kye,
    },
    {
      name: "Shun Ying",
      role: "Microbiologist",
      bio: "Microbiologist specializing in organic matter decomposition and fermentation processes for sustainable waste management systems.",
      image: shunying,
    },
    {
      name: "Anson Liu",
      role: "Robotics Specialist",
      bio: "Designing and implementing robotic systems for automated planting, monitoring, and harvesting in controlled agricultural environments.",
      image: anson,
    },
    {
      name: "Lauren Safier",
      role: "Design Expert",
      bio: "Leading branding and product design efforts to create intuitive, beautiful interfaces and user experiences for the project's technology.",
      image: lauren,
    },
    // {
    //   name: "Jessica Stringham",
    //   role: "Data Scientist",
    //   bio: "Specializes in environmental data analysis and visualization, developing algorithms to optimize the Bokashi fermentation process.",
    //   image: jessica,
    //   social: {
    //     twitter: "#",
    //     linkedin: "#",
    //     github: "#",
    //   },
    // },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {/* Hero Section with Parallax */}
        {/* <Globe /> */}
        <section className="relative py-20 md:py-28 lg:py-36 overflow-hidden bg-gradient-to-b from-emerald-50 to-white">
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              backgroundImage: `url('/placeholder.svg?height=600&width=800')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="container px-4 md:px-6 mx-auto max-w-7xl relative">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <motion.div
                className="flex flex-col justify-center space-y-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeIn}
              >
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Transforming Food Waste Into Autonomous Food Production
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    A research project exploring closed-loop systems that turn
                    food waste into resources through sensor-driven Bokashi
                    fermentation and robotic farming.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="bg-emerald-600 hover:bg-emerald-700 transition-all duration-300">
                      Explore Research
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="border-emerald-600 text-emerald-600 transition-all duration-300"
                    >
                      View Prototype <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <div className="relative w-full h-[400px] rounded-lg overflow-hidden shadow-lg">
                  <img
                    src="/placeholder.svg?height=400&width=500"
                    alt="Bokashi composting system with sensors"
                    className="object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white text-sm">
                      Our sensorized Bokashi prototype in action
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        {/* Research Focus Section */}
        <section className="py-16 md:py-24 bg-white" id="research">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Our Research Focus
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  FoodCam2Farm is developing a closed-loop composting and
                  farming system that begins with instrumented Bokashi
                  fermentation.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div
                className="flex flex-col justify-center space-y-4"
                variants={fadeIn}
              >
                <ul className="grid gap-6">
                  <motion.li
                    className="flex items-start gap-4"
                    variants={fadeIn}
                  >
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                      variants={iconAnimation}
                    >
                      <Microscope className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Instrumenting Bokashi Fermentation
                      </h3>
                      <p className="text-muted-foreground">
                        We've built a prototype Bokashi bin equipped with
                        sensors to monitor CO₂, temperature, pressure, moisture,
                        and liquid levels in real-time.
                      </p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-4"
                    variants={fadeIn}
                  >
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                      variants={iconAnimation}
                    >
                      <LineChart className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Data-Driven Insights
                      </h3>
                      <p className="text-muted-foreground">
                        Our sensor-driven approach allows us to identify
                        microbial activity signatures, understand system
                        behavior, and characterize the fermentation process.
                      </p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-4"
                    variants={fadeIn}
                  >
                    <motion.div
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                      variants={iconAnimation}
                    >
                      <Robot className="h-5 w-5" />
                    </motion.div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Autonomous Farming Integration
                      </h3>
                      <p className="text-muted-foreground">
                        The long-term vision connects our smart composting unit
                        to a 3-axis CNC robotic garden capable of automated
                        planting, fertilizing, and harvesting.
                      </p>
                    </div>
                  </motion.li>
                </ul>
              </motion.div>
              <motion.div
                className="relative rounded-xl overflow-hidden shadow-lg"
                variants={fadeIn}
              >
                <img
                  src="/placeholder.svg?height=400&width=500"
                  alt="Bokashi fermentation process visualization"
                  width={500}
                  height={400}
                  className="w-full h-auto object-cover"
                />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-emerald-600/20 to-transparent"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                />
              </motion.div>
            </motion.div>
          </div>
        </section>
        {/* How It Works Section with Interactive Tabs */}
        <section className="py-16 md:py-24 bg-emerald-50" id="how-it-works">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  How Our System Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our research combines sensor technology, microbial
                  fermentation, and robotics to create a closed-loop system.
                </p>
              </div>
            </motion.div>

            <div className="mx-auto max-w-5xl py-12">
              <Tabs defaultValue="bokashi" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8 bg-emerald-100 rounded-lg p-1">
                  <TabsTrigger
                    value="bokashi"
                    className="data-[state=active]:bg-white rounded-md py-2 px-3 cursor-pointer transition-all hover:bg-emerald-50 data-[state=active]:shadow-sm"
                  >
                    Bokashi Fermentation
                  </TabsTrigger>
                  <TabsTrigger
                    value="monitoring"
                    className="data-[state=active]:bg-white rounded-md py-2 px-3 cursor-pointer transition-all hover:bg-emerald-50 data-[state=active]:shadow-sm"
                  >
                    Sensor Monitoring
                  </TabsTrigger>
                  <TabsTrigger
                    value="automation"
                    className="data-[state=active]:bg-white rounded-md py-2 px-3 cursor-pointer transition-all hover:bg-emerald-50 data-[state=active]:shadow-sm"
                  >
                    Robotic Automation
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="bokashi"
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <motion.div
                    className="grid md:grid-cols-2 gap-8 items-center"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeIn} className="space-y-4">
                      <h3 className="text-2xl font-bold">
                        Bokashi Fermentation Process
                      </h3>
                      <p>
                        Bokashi is a compact, anaerobic fermentation method that
                        turns food waste into a soil-ready pre-compost and
                        nutrient-rich liquid fertilizer ("Bokashi tea").
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <motion.div
                            className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
                            variants={iconAnimation}
                          >
                            1
                          </motion.div>
                          <span>
                            Food waste is collected and added to the Bokashi bin
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <motion.div
                            className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
                            variants={iconAnimation}
                          >
                            2
                          </motion.div>
                          <span>
                            Effective microorganisms (EM) are introduced to
                            start fermentation
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <motion.div
                            className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
                            variants={iconAnimation}
                          >
                            3
                          </motion.div>
                          <span>
                            Anaerobic fermentation occurs over a 2-week period
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <motion.div
                            className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
                            variants={iconAnimation}
                          >
                            4
                          </motion.div>
                          <span>
                            Liquid fertilizer is drained periodically during
                            fermentation
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <motion.div
                            className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"
                            variants={iconAnimation}
                          >
                            5
                          </motion.div>
                          <span>
                            Fermented material is ready for soil integration
                          </span>
                        </li>
                      </ul>
                    </motion.div>
                    <motion.div
                      variants={fadeIn}
                      className="relative h-[300px] rounded-lg overflow-hidden"
                    >
                      <img
                        src="/placeholder.svg?height=300&width=400"
                        alt="Bokashi fermentation process"
                        className="object-cover"
                      />
                    </motion.div>
                  </motion.div>
                </TabsContent>
                <TabsContent
                  value="monitoring"
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <motion.div
                    className="grid md:grid-cols-2 gap-8 items-center"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeIn} className="space-y-4">
                      <h3 className="text-2xl font-bold">
                        Sensor Monitoring System
                      </h3>
                      <p>
                        Our prototype Bokashi bin is equipped with multiple
                        sensors to monitor the fermentation process in
                        real-time, providing valuable data for optimization.
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-2">
                          <motion.div
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Gauge className="h-4 w-4" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">CO₂ Levels</h4>
                            <p className="text-sm text-muted-foreground">
                              Tracking microbial activity
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <motion.div
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Thermometer className="h-4 w-4" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">Temperature</h4>
                            <p className="text-sm text-muted-foreground">
                              Monitoring heat generation
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <motion.div
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Droplets className="h-4 w-4" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">Moisture</h4>
                            <p className="text-sm text-muted-foreground">
                              Ensuring optimal conditions
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <motion.div
                            className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Wind className="h-4 w-4" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">Pressure</h4>
                            <p className="text-sm text-muted-foreground">
                              Tracking gas production
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    <motion.div variants={fadeIn} className="space-y-4">
                      <div className="relative h-[250px] rounded-lg overflow-hidden border">
                        <canvas
                          ref={chartRef}
                          width={500}
                          height={250}
                          className="w-full h-full"
                        ></canvas>
                      </div>
                      <p className="text-sm text-center text-muted-foreground">
                        Real-time sensor data from our current Bokashi
                        fermentation experiment
                      </p>
                    </motion.div>
                  </motion.div>
                </TabsContent>
                <TabsContent
                  value="automation"
                  className="p-4 bg-white rounded-lg shadow-sm"
                >
                  <motion.div
                    className="grid md:grid-cols-2 gap-8 items-center"
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeIn} className="space-y-4">
                      <h3 className="text-2xl font-bold">
                        Robotic Farming Integration
                      </h3>
                      <p>
                        The next phase of our research connects the smart
                        composting unit to a 3-axis CNC robotic garden for
                        automated food production.
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <motion.div
                            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Sprout className="h-3 w-3" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">Automated Planting</h4>
                            <p className="text-sm text-muted-foreground">
                              Precision seed placement and germination
                              monitoring
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <motion.div
                            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Droplets className="h-3 w-3" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">
                              Targeted Fertilization
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Applying Bokashi tea directly where and when
                              needed
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <motion.div
                            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <LineChart className="h-3 w-3" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">Growth Monitoring</h4>
                            <p className="text-sm text-muted-foreground">
                              Computer vision tracking of plant development
                            </p>
                          </div>
                        </li>
                        <li className="flex items-start gap-3">
                          <motion.div
                            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
                            variants={iconAnimation}
                          >
                            <Recycle className="h-3 w-3" />
                          </motion.div>
                          <div>
                            <h4 className="font-medium">Closed-Loop System</h4>
                            <p className="text-sm text-muted-foreground">
                              Harvested food waste returns to the Bokashi system
                            </p>
                          </div>
                        </li>
                      </ul>
                    </motion.div>
                    <motion.div
                      variants={fadeIn}
                      className="relative h-[300px] rounded-lg overflow-hidden"
                    >
                      <img
                        src="/placeholder.svg?height=300&width=400"
                        alt="CNC robotic garden concept"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <p className="text-white text-sm p-4">
                          Concept visualization of our 3-axis CNC robotic garden
                          system
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </section>
        {/* Data Visualization Section */}
        <section className="py-16 md:py-24 bg-white" id="data">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Research Findings
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our initial experiments with banana peel fermentation have
                  yielded valuable insights into the Bokashi process.
                </p>
              </div>
            </motion.div>

            <motion.div
              className="mx-auto max-w-5xl py-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div
                className="grid md:grid-cols-2 gap-8 items-center mb-12"
                variants={fadeIn}
              >
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Key Observations</h3>
                  <p>
                    Over a two-week fermentation period, we observed distinct
                    patterns in our sensor data that correspond to different
                    phases of microbial activity.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600"></div>
                      <span>
                        Initial CO₂ spike within 24-48 hours indicating rapid
                        microbial colonization
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600"></div>
                      <span>
                        Temperature increases of 2-4°C above ambient during peak
                        fermentation
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600"></div>
                      <span>
                        Gradual moisture reduction as fermentation progresses
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-600"></div>
                      <span>
                        pH stabilization in the acidic range (3.5-4.5) after one
                        week
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="relative h-[300px] rounded-lg overflow-hidden border shadow-sm">
                  <img
                    src="/placeholder.svg?height=300&width=400"
                    alt="Bokashi fermentation experiment with banana peels"
                    className="object-cover"
                  />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-emerald-50" id="team">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div variants={fadeIn} className="space-y-6">
              <h3 className="text-2xl font-bold text-center">
                Interactive Research FAQ
              </h3>
              <Accordion
                type="single"
                collapsible
                className="w-full space-y-2 overflow-hidden"
              >
                <AccordionItem value="item-1" className="border-b">
                  <AccordionTrigger className="flex justify-between items-center w-full py-4 px-3 font-medium text-left hover:bg-emerald-50 rounded-md transition-all cursor-pointer">
                    Why focus on Bokashi fermentation?
                    <ChevronDown className="h-5 w-5 text-emerald-600 shrink-0 transition-transform duration-300 ease-in-out data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 text-muted-foreground overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    Bokashi fermentation offers several advantages over
                    traditional composting: it's faster (2 weeks vs. months),
                    more compact (ideal for urban settings), can process all
                    food waste including meat and dairy, produces minimal odor,
                    and creates both solid pre-compost and liquid fertilizer.
                    These properties make it ideal for closed-loop systems where
                    space and time efficiency are critical.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border-b">
                  <AccordionTrigger className="flex justify-between items-center w-full py-4 px-3 font-medium text-left hover:bg-emerald-50 rounded-md transition-all cursor-pointer">
                    What sensors are you using in your prototype?
                    <ChevronDown className="h-5 w-5 text-emerald-600 shrink-0 transition-transform duration-300 ease-in-out data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 text-muted-foreground overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    Our current prototype uses a CO₂ sensor (MH-Z19B),
                    temperature and humidity sensors (DHT22), pressure sensors
                    to detect gas buildup, liquid level sensors to monitor
                    Bokashi tea production, and pH probes to track
                    acidification. All sensors are connected to a
                    microcontroller that logs data and transmits it to our
                    research database for analysis.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border-b">
                  <AccordionTrigger className="flex justify-between items-center w-full py-4 px-3 font-medium text-left hover:bg-emerald-50 rounded-md transition-all cursor-pointer">
                    How will the robotic garden integrate with the Bokashi
                    system?
                    <ChevronDown className="h-5 w-5 text-emerald-600 shrink-0 transition-transform duration-300 ease-in-out data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 text-muted-foreground overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    The 3-axis CNC robotic garden will be designed to
                    automatically plant seeds, apply Bokashi tea fertilizer at
                    optimal times, monitor plant growth using computer vision,
                    and harvest mature crops. The system will use data from both
                    the Bokashi fermentation process and plant growth metrics to
                    optimize growing conditions. Food waste from harvesting will
                    be returned to the Bokashi system, creating a true closed
                    loop.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border-b">
                  <AccordionTrigger className="flex justify-between items-center w-full py-4 px-3 font-medium text-left hover:bg-emerald-50 rounded-md transition-all cursor-pointer">
                    What are the applications for this research?
                    <ChevronDown className="h-5 w-5 text-emerald-600 shrink-0 transition-transform duration-300 ease-in-out data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 text-muted-foreground overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    Our research has applications in urban agriculture, where
                    space and resource efficiency are critical. It could enable
                    apartment dwellers to grow food from their own waste. The
                    system also has potential applications in controlled
                    environment agriculture, disaster relief (providing food
                    independence), and even space habitation, where closed-loop
                    life support systems are essential for long-term missions.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5" className="border-b">
                  <AccordionTrigger className="flex justify-between items-center w-full py-4 px-3 font-medium text-left hover:bg-emerald-50 rounded-md transition-all cursor-pointer">
                    How can I get involved in this research?
                    <ChevronDown className="h-5 w-5 text-emerald-600 shrink-0 transition-transform duration-300 ease-in-out data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                  <AccordionContent className="px-3 pt-2 pb-4 text-muted-foreground overflow-hidden transition-all data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    We welcome collaboration from researchers, engineers, urban
                    farmers, and sustainability enthusiasts. You can contribute
                    by replicating our experiments, suggesting improvements to
                    our sensor array, helping develop the robotic garden
                    components, or providing food waste samples for comparative
                    studies. Contact us through the form below to discuss
                    specific collaboration opportunities.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24 bg-white" id="team">
          <div className="container px-4 md:px-6 mx-auto">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Meet Our Team
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our interdisciplinary team combines expertise in microbiology,
                  robotics, and data science to drive innovation in sustainable
                  food systems.
                </p>
              </div>
            </motion.div>

            <div className="mx-auto max-w-6xl py-12">
              <div className="grid gap-8 md:grid-cols-3">
                {teamMembers.map((member, index) => (
                  <motion.div
                    key={index}
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="relative w-48 h-48 mb-4 overflow-hidden rounded-full scale-75">
                      <img
                        src={member.image || "/placeholder.svg"}
                        alt={member.name}
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-emerald-600 font-medium mb-2">
                      {member.role}
                    </p>
                    <p className="text-muted-foreground text-sm mb-4">
                      {member.bio}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* Vision Section with Parallax
        <section
          className="py-16 md:py-24 bg-emerald-700 text-white relative overflow-hidden"
          id="vision"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              transform: `translateY(${scrollY * 0.05}px)`,
              backgroundImage: `url('/placeholder.svg?height=600&width=800')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="container px-4 md:px-6 mx-auto max-w-7xl relative">
            <motion.div
              className="grid gap-6 lg:grid-cols-2 lg:gap-12"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.div
                className="flex flex-col justify-center space-y-4"
                variants={fadeIn}
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Our Vision for the Future
                  </h2>
                  <p className="max-w-[600px] text-emerald-100 md:text-xl/relaxed">
                    We're working toward a future where food waste becomes a
                    resource for autonomous food production, creating truly
                    sustainable closed-loop systems.
                  </p>
                </div>
                <ul className="space-y-4">
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeIn}
                  >
                    <motion.div
                      className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                      variants={iconAnimation}
                    >
                      <Sprout className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold">Food Independence</h3>
                      <p className="text-emerald-100">
                        Enabling individuals and communities to grow nutritious
                        food from their own waste
                      </p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeIn}
                  >
                    <motion.div
                      className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                      variants={iconAnimation}
                    >
                      <Globe className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold">
                        Sustainable Urban Agriculture
                      </h3>
                      <p className="text-emerald-100">
                        Creating scalable models for waste-to-food systems in
                        space-constrained urban environments
                      </p>
                    </div>
                  </motion.li>
                  <motion.li
                    className="flex items-start gap-3"
                    variants={fadeIn}
                  >
                    <motion.div
                      className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                      variants={iconAnimation}
                    >
                      <Rocket className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold">Space-Based Applications</h3>
                      <p className="text-emerald-100">
                        Developing closed-loop life support systems for
                        long-duration space missions and habitation
                      </p>
                    </div>
                  </motion.li>
                </ul>
                <motion.div
                  className="pt-4"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button className="bg-white text-emerald-700 hover:bg-emerald-100 transition-all duration-300">
                    Join Our Research Network{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </motion.div>
              <motion.div
                className="flex flex-col space-y-4 rounded-lg bg-emerald-800 p-6"
                variants={fadeIn}
              >
                <h3 className="text-xl font-bold">Get Involved</h3>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-medium leading-none"
                    >
                      Name
                    </label>
                    <Input
                      id="name"
                      className="bg-emerald-700 border-emerald-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      className="bg-emerald-700 border-emerald-600"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor="interest"
                      className="text-sm font-medium leading-none"
                    >
                      I'm interested in:
                    </label>
                    <select
                      id="interest"
                      className="flex h-10 w-full rounded-md border border-emerald-600 bg-emerald-700 px-3 py-2 text-sm"
                    >
                      <option>Replicating your experiments</option>
                      <option>Contributing to sensor development</option>
                      <option>Robotic garden collaboration</option>
                      <option>Academic partnership</option>
                      <option>Funding opportunities</option>
                    </select>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="w-full bg-white text-emerald-700 hover:bg-emerald-100 transition-all duration-300">
                      Submit
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section> */}
      </main>
    </div>
  );
}
