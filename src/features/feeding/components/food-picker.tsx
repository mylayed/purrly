import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button, Chip, ErrorBanner, Text, TextField } from '@/components/ui';
import { useTheme } from '@/theme';

import { useSaveFood, type Food } from '../api';

type FoodPickerProps = {
  catId: string;
  foods: Food[];
  value: string | null;
  onChange: (food: Food | null) => void;
  disabled?: boolean;
};

// Корм зі списку кота; новий можна додати тут же, не виходячи з форми.
// Повторне натискання на вибраний корм знімає вибір — корм необов'язковий.
export function FoodPicker({ catId, foods, value, onChange, disabled }: FoodPickerProps) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const saveFood = useSaveFood(catId);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function add() {
    const trimmed = name.trim();
    if (!trimmed || saveFood.isPending) return;
    saveFood.mutate(
      { input: { name: trimmed, kind: 'dry', kcalPer100g: null } },
      {
        onSuccess: (food) => {
          onChange(food);
          setName('');
          setAdding(false);
        },
      },
    );
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="label">{t('feeding.food')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {foods.map((food) => (
          <Chip
            key={food.id}
            label={food.name}
            selected={food.id === value}
            disabled={disabled}
            onPress={() => onChange(food.id === value ? null : food)}
          />
        ))}
        {!adding && (
          <Chip
            label={t('feeding.newFood')}
            accessibilityRole="button"
            disabled={disabled}
            onPress={() => setAdding(true)}
          />
        )}
      </View>
      {adding && (
        <View style={{ gap: spacing.sm }}>
          <TextField
            label={t('feeding.foods.name')}
            placeholder={t('feeding.foods.namePlaceholder')}
            hint={t('feeding.newFoodHint')}
            value={name}
            onChangeText={setName}
            onSubmitEditing={add}
            maxLength={80}
            autoFocus
            editable={!saveFood.isPending}
          />
          {saveFood.isError && <ErrorBanner message={t('feeding.saveError')} />}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button
              title={t('feeding.foods.add')}
              variant="secondary"
              disabled={!name.trim() || saveFood.isPending}
              onPress={add}
              style={{ flex: 1 }}
            />
            <Button
              title={t('deleteAccount.cancel')}
              variant="ghost"
              disabled={saveFood.isPending}
              onPress={() => setAdding(false)}
            />
          </View>
        </View>
      )}
    </View>
  );
}
