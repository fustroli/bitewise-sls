// @vitest-environment jsdom

import {
  IResourceForm,
  IResourceRecord,
} from '@/app/(modules)/dashboard/(modules)/_resource-table/interfaces';
import {
  TestQueryProvider,
  createTestQueryClient,
} from '@/app/utils/testing/test-query-provider';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import InputField from '@/app/components/form/InputField';
import ResourceFormDialog from '@/app/(modules)/dashboard/(modules)/_resource-table/components/ResourceFormDialog';
import { TApiResult } from '@/app/utils/interfaces';
import { copy as en } from '@/app/copy';
import { toast } from '@/app/hooks/use-toast';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

vi.mock('@/app/hooks/use-toast', () => ({ toast: vi.fn() }));

type TValues = { name: string };

const OK: TApiResult<unknown> = { ok: true, data: undefined };
const FAILED: TApiResult<unknown> = {
  ok: false,
  status: 400,
  message: 'Name taken',
};

const create = vi.fn<IResourceForm<IResourceRecord, TValues>['create']>();
const update = vi.fn<IResourceForm<IResourceRecord, TValues>['update']>();

const config: IResourceForm<IResourceRecord, TValues> = {
  resourceKey: 'ingredients',
  schema: () => z.object({ name: z.string().min(1) }),
  defaultValues: { name: '' },
  toFormValues: (record) => ({ name: record.name }),
  fields: ({ form }) => (
    <InputField control={form.control} label="Name" name="name" type="text" />
  ),
  create,
  update,
  remove: vi.fn(),
  compareType: 'ingredients',
  invalidates: [['ingredients']],
};

const ID = '01JAZ3Q8V6X2M5N7P9R1S3T5W7';

let queryClient = createTestQueryClient();

const renderDialog = (record?: IResourceRecord, duplicate?: boolean) =>
  render(
    <TestQueryProvider client={queryClient}>
      <ResourceFormDialog
        config={config}
        record={record}
        duplicate={duplicate}
        formData={undefined}
      />
    </TestQueryProvider>,
  );

/** The Add dialog's trigger; its submit button is plain "Add". */
const ADD_TRIGGER = en.resources.ingredients.addTitle;

const nameInput = () => screen.getByRole<HTMLInputElement>('textbox');

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createTestQueryClient();
});

afterEach(cleanup);

describe('ResourceFormDialog', () => {
  it('creates, closes, and resets the form on success', async () => {
    const user = userEvent.setup();
    create.mockResolvedValue(OK);
    renderDialog();

    await user.click(screen.getByRole('button', { name: ADD_TRIGGER }));
    await user.type(nameInput(), 'Oats');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(create).toHaveBeenCalledWith({ name: 'Oats' });
    expect(toast).toHaveBeenCalledWith({
      variant: 'success',
      description: en.resourceTable.created,
    });
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: ADD_TRIGGER }));
    expect(nameInput().value).toBe('');
  });

  it('opens Edit pre-filled with the record', async () => {
    const user = userEvent.setup();
    renderDialog({ id: ID, name: 'Oats' });

    await user.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(nameInput().value).toBe('Oats');
  });

  it('updates and closes on success', async () => {
    const user = userEvent.setup();
    update.mockResolvedValue(OK);
    renderDialog({ id: ID, name: 'Oats' });

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    await user.clear(nameInput());
    await user.type(nameInput(), 'Rolled oats');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(update).toHaveBeenCalledWith({ name: 'Rolled oats' }, ID);
    expect(create).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('stays open and shows the message on failure', async () => {
    const user = userEvent.setup();
    create.mockResolvedValue(FAILED);
    renderDialog();

    await user.click(screen.getByRole('button', { name: ADD_TRIGGER }));
    await user.type(nameInput(), 'Oats');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(toast).toHaveBeenCalledWith({
      variant: 'error',
      description: 'Name taken',
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(nameInput().value).toBe('Oats');
  });

  it('shows a taken name on the name field instead of a toast', async () => {
    const user = userEvent.setup();
    create.mockResolvedValue({ ...FAILED, status: 409 });
    renderDialog();

    await user.click(screen.getByRole('button', { name: ADD_TRIGGER }));
    await user.type(nameInput(), 'Oats');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText(en.resourceTable.nameTaken)).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('duplicates into an Add dialog prefilled with a "Copy of" name', async () => {
    const user = userEvent.setup();
    renderDialog({ id: ID, name: 'Oats' }, true);

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(nameInput().value).toBe('Copy of Oats');
  });

  it('creates, not updates, on submitting a duplicate', async () => {
    const user = userEvent.setup();
    create.mockResolvedValue(OK);
    renderDialog({ id: ID, name: 'Oats' }, true);

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(create).toHaveBeenCalledWith({ name: 'Copy of Oats' });
    expect(update).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith({
      variant: 'success',
      description: en.resourceTable.created,
    });
  });

  it('re-seeds a discarded duplicate from the source row', async () => {
    const user = userEvent.setup();
    renderDialog({ id: ID, name: 'Oats' }, true);

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));
    await user.type(nameInput(), ' edited');
    await user.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(nameInput().value).toBe('Copy of Oats');
  });

  it('shows a taken duplicate name on the name field', async () => {
    const user = userEvent.setup();
    create.mockResolvedValue({ ...FAILED, status: 409 });
    renderDialog({ id: ID, name: 'Oats' }, true);

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));
    await user.click(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText(en.resourceTable.nameTaken)).toBeTruthy();
    expect(toast).not.toHaveBeenCalled();
  });

  it('marks the queries it lists stale after a save, and only on success', async () => {
    const user = userEvent.setup();
    const listKey = ['ingredients', 'list', {}];
    const otherKey = ['meals', 'list', {}];
    queryClient.setQueryData(listKey, { data: [], count: 0 });
    queryClient.setQueryData(otherKey, { data: [], count: 0 });
    const isStale = (key: unknown[]) =>
      queryClient.getQueryState(key)?.isInvalidated;
    create.mockResolvedValueOnce(FAILED).mockResolvedValueOnce(OK);
    renderDialog();

    await user.click(screen.getByRole('button', { name: ADD_TRIGGER }));
    await user.type(nameInput(), 'Oats');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(isStale(listKey)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Add' }));
    expect(isStale(listKey)).toBe(true);
    expect(isStale(otherKey)).toBe(false);
  });
});
