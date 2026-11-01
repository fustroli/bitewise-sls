'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

import { ETheme } from '@/app/(modules)/dashboard/(modules)/profile/enum';
import SettingsRow from '@/app/(modules)/dashboard/(modules)/profile/components/SettingsRow';
import { useDictionary } from '@/app/providers/dictionary-provider';
import { useTheme } from 'next-themes';

const Theme = () => {
  const { profile } = useDictionary();
  const { setTheme, theme } = useTheme();

  return (
    <SettingsRow
      title={profile.appearance.theme}
      description={profile.appearance.themeDesc}
    >
      <div className="rounded-lg border bg-card p-4 md:p-6">
        {/* `theme` is undefined until next-themes mounts; '' shows the placeholder. */}
        <Select value={theme ?? ''} onValueChange={setTheme}>
          <SelectTrigger
            className="w-full sm:w-[220px]"
            aria-label={profile.appearance.theme}
          >
            <SelectValue placeholder={profile.appearance.theme} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ETheme.LIGHT}>
              {profile.appearance.light}
            </SelectItem>
            <SelectItem value={ETheme.DARK}>
              {profile.appearance.dark}
            </SelectItem>
            <SelectItem value={ETheme.SYSTEM}>
              {profile.appearance.system}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </SettingsRow>
  );
};

export default Theme;
