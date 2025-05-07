
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Calculator } from 'lucide-react'; // Use Calculator icon from lucide-react


const CalculatorModal: React.FC = () => {
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [operand, setOperand] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplayValue('0.');
      setWaitingForOperand(false);
    } else if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const clearDisplay = () => {
    setDisplayValue('0');
    setOperand(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(displayValue);

    if (operand === null) {
      setOperand(inputValue);
    } else if (operator) {
      const currentValue = operand || 0;
      const result = calculate(currentValue, inputValue, operator);
      setOperand(result);
      setDisplayValue(String(result));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (prevValue: number, nextValue: number, op: string): number => {
    let result;
    switch (op) {
      case '+':
        result = prevValue + nextValue;
        break;
      case '-':
        result = prevValue - nextValue;
        break;
      case '*':
        result = prevValue * nextValue;
        break;
      case '/':
        result = nextValue === 0 ? NaN : prevValue / nextValue; 
        break;
      default:
        return nextValue;
    }
    return parseFloat(result.toPrecision(12));
  };

  const handleEquals = () => {
    const inputValue = parseFloat(displayValue);
    if (operator && operand !== null) {
      const result = calculate(operand, inputValue, operator);
      if (isNaN(result)) {
        setDisplayValue("Error");
      } else {
        setDisplayValue(String(result));
      }
      setOperand(null); 
      setOperator(null);
      setWaitingForOperand(true); 
    }
  };
  
  const buttons = [
    { label: 'C', action: clearDisplay, type: 'clear', className: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' },
    { label: '±', action: () => { /* TODO */ }, type: 'modifier', disabled: true },
    { label: '%', action: () => { /* TODO */ }, type: 'modifier', disabled: true },
    { label: '/', action: () => performOperation('/'), type: 'operator' },
    { label: '7', action: () => inputDigit('7'), type: 'number' },
    { label: '8', action: () => inputDigit('8'), type: 'number' },
    { label: '9', action: () => inputDigit('9'), type: 'number' },
    { label: '*', action: () => performOperation('*'), type: 'operator' },
    { label: '4', action: () => inputDigit('4'), type: 'number' },
    { label: '5', action: () => inputDigit('5'), type: 'number' },
    { label: '6', action: () => inputDigit('6'), type: 'number' },
    { label: '-', action: () => performOperation('-'), type: 'operator' },
    { label: '1', action: () => inputDigit('1'), type: 'number' },
    { label: '2', action: () => inputDigit('2'), type: 'number' },
    { label: '3', action: () => inputDigit('3'), type: 'number' },
    { label: '+', action: () => performOperation('+'), type: 'operator' },
    { label: '0', action: () => inputDigit('0'), type: 'number', className: 'col-span-2' },
    { label: '.', action: () => inputDecimal(), type: 'number' },
    { label: '=', action: handleEquals, type: 'equals', className: 'bg-primary hover:bg-primary/90 text-primary-foreground' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-9 text-sm">
            <Calculator size={16} className="mr-1.5" /> Calculator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[320px] p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Calculator</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            type="text"
            value={displayValue}
            readOnly
            className="h-12 text-right text-2xl font-mono bg-muted focus-visible:ring-transparent border-input"
            data-testid="calculator-display"
          />
          <div className="grid grid-cols-4 gap-2">
            {buttons.map((btn) => (
              <Button
                key={btn.label}
                onClick={btn.action}
                variant={btn.type === 'operator' || btn.type === 'clear' || btn.type === 'modifier' ? 'outline' : (btn.type === 'equals' ? 'default' : 'secondary')}
                className={cn(
                  "h-12 text-lg font-medium py-0 px-2",
                  btn.className,
                  (btn.type === 'equals' || (btn.type === 'clear' && btn.label === 'C')) ? 'text-primary-foreground' : 
                  (btn.type === 'operator' ? 'text-primary' : ''), // Make operators primary color
                  btn.disabled ? 'opacity-50 cursor-not-allowed' : ''
                )}
                data-testid={`calculator-button-${btn.label}`}
                disabled={btn.disabled}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>
        <DialogFooter className="mt-3 pt-3 border-t sm:justify-end">
          <DialogClose asChild>
            <Button type="button" variant="ghost">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CalculatorModal };
