"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Esqueceu sua senha?</h1>
        <p className="text-muted-foreground mt-2">
          Como você faz login com Google ou Apple, a redefinição de senha deve ser feita diretamente na plataforma respectiva.
        </p>
      </div>
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Para redefinir sua senha:
            </p>
            <div className="space-y-2 text-left">
              <p className="text-sm"><strong>Google:</strong> Acesse sua conta Google e redefina sua senha lá.</p>
              <p className="text-sm"><strong>Apple:</strong> Acesse seu ID Apple e redefina sua senha lá.</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
