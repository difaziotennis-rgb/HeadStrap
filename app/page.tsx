'use client'

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Calendar } from "lucide-react";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3">
              DiFazio Tennis
            </h1>
            <p className="text-lg text-gray-600">
              Book lessons and view ladder rankings
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Book Lesson Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/book')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Book a Lesson
                </CardTitle>
                <CardDescription>
                  Schedule your private tennis lesson
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  Book Now
                </Button>
              </CardContent>
            </Card>

            {/* Ladder Card */}
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/ladder')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Tennis Ladder
                </CardTitle>
                <CardDescription>
                  View rankings and standings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  View Ladder
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}









