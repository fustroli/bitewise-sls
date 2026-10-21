// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { Form } from '@/app/components/ui/form';
import InputField from '@/app/components/form/InputField';
import { useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

afterEach(cleanup);

type TText = { name: string };

const TextHarness = ({ onBlur }: { onBlur?: () => void }) => {
  const form = useForm<TText>({ defaultValues: { name: '' } });

  return (
    <Form {...form}>
      <InputField
        control={form.control}
        name="name"
        label="Name"
        onBlur={onBlur}
      />
      <p data-testid="touched">{String(!!form.formState.touchedFields.name)}</p>
    </Form>
  );
};

const numberSchema = z.object({ amount: z.number({ error: 'Required' }) });
type TNumber = z.infer<typeof numberSchema>;

const NumberHarness = ({ onSubmit }: { onSubmit: (v: TNumber) => void }) => {
  const form = useForm<TNumber>({
    resolver: zodResolver(numberSchema),
    defaultValues: { amount: 5 },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <InputField
          control={form.control}
          name="amount"
          label="Amount"
          type="number"
        />
        <button type="submit">Save</button>
      </form>
    </Form>
  );
};

// Type-level check, picked up by `tsc` in `bun run build`.
const WrongName = () => {
  const form = useForm<TText>();

  // @ts-expect-error `nmae` is not a field of TText.
  return <InputField control={form.control} name="nmae" />;
};
void WrongName;

describe('InputField', () => {
  it('marks the field as touched on blur without a caller onBlur', async () => {
    const user = userEvent.setup();
    render(<TextHarness />);

    await user.click(screen.getByLabelText('Name'));
    await user.tab();

    expect(screen.getByTestId('touched').textContent).toBe('true');
  });

  it('marks the field as touched and calls the caller onBlur', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    render(<TextHarness onBlur={onBlur} />);

    await user.click(screen.getByLabelText('Name'));
    await user.tab();

    expect(screen.getByTestId('touched').textContent).toBe('true');
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('fails a required number schema when emptied instead of submitting 0', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NumberHarness onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Amount'));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('submits typed numbers as numbers', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NumberHarness onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Amount'));
    await user.type(screen.getByLabelText('Amount'), '12.5');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit.mock.calls[0][0]).toEqual({ amount: 12.5 });
  });
});
