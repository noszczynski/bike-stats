'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AUTO_TAGGING_RULES } from '@/features/training/auto-tagging-rules';
import { Info } from 'lucide-react';

export function AutoTaggingRulesInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Automatyczne reguły tagowania
        </CardTitle>
        <CardDescription>
          Te tagi są automatycznie przypisywane do treningów na podstawie ich parametrów
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {AUTO_TAGGING_RULES.map((rule, index) => (
            <div key={index}>
              <div className="flex items-center gap-3 mb-2">
                <Badge
                  variant="secondary"
                  className="text-white font-medium"
                  style={{
                    backgroundColor: rule.color,
                    color: 'white',
                  }}
                >
                  {/* <span className="text-xs mr-1">
                    {rule.icon}
                  </span> */}
                  {rule.tagName}
                </Badge>
                <span className="text-sm text-muted-foreground">🤖 Automatyczny</span>
              </div>
              <p className="text-sm text-muted-foreground ml-1">
                {rule.description}
              </p>
              {index < AUTO_TAGGING_RULES.length - 1 && (
                <Separator className="mt-4" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Uwaga:</strong> Automatyczne tagi są aktualizowane po każdym:
          </p>
          <ul className="text-xs text-muted-foreground mt-1 ml-4 list-disc space-y-1">
            <li>Imporcie nowego treningu</li>
            <li>Przetworzeniu pliku FIT</li>
            <li>Ręcznym odświeżeniu tagów</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 