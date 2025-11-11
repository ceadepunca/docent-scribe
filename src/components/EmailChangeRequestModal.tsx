import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

interface EmailChangeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

const emailSchema = z.object({
  newEmail: z.string().email('Email inválido'),
  reason: z.string().optional()
});

export const EmailChangeRequestModal: React.FC<EmailChangeRequestModalProps> = ({
  open,
  onOpenChange,
  currentEmail
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      emailSchema.parse({ newEmail, reason });
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    if (newEmail === currentEmail) {
      setError('El nuevo email debe ser diferente al actual');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await supabase
        .from('email_change_requests')
        .insert({
          user_id: user?.id,
          current_email: currentEmail,
          new_email: newEmail,
          reason: reason || null,
          status: 'pending'
        });

      if (insertError) throw insertError;

      toast({
        title: 'Solicitud enviada',
        description: 'Su solicitud de cambio de email ha sido enviada al administrador para su revisión.',
      });

      setNewEmail('');
      setReason('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating email change request:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la solicitud. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Cambio de Email</DialogTitle>
          <DialogDescription>
            El email es un dato sensible vinculado a su DNI. Su solicitud será revisada por un administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentEmail">Email Actual</Label>
            <Input
              id="currentEmail"
              type="email"
              value={currentEmail}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">Nuevo Email *</Label>
            <Input
              id="newEmail"
              type="email"
              placeholder="nuevo@ejemplo.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo del Cambio (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Explique brevemente por qué necesita cambiar su email"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-muted-foreground">
              ℹ️ <strong>Importante:</strong> Una vez aprobado el cambio, el nuevo email quedará vinculado a su DNI.
              Recibirá una notificación cuando su solicitud sea revisada.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};