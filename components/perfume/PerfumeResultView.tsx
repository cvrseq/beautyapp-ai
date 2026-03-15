import { APPLE_TEXT_STYLES } from '@/constants/fonts';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme, Theme } from '@/hooks/useTheme';

// Types for perfume data
interface NotePyramid {
  top: string[];
  heart: string[];
  base: string[];
}

interface FragranceAccord {
  name: string;
  strength: number;
}

interface Seasonality {
  spring: number;
  summer: number;
  fall: number;
  winter: number;
}

interface TimeOfDay {
  day: number;
  evening: number;
  night: number;
}

interface Longevity {
  hours: number;
  rating: number;
  description: string;
}

interface Sillage {
  level: 'intimate' | 'moderate' | 'strong' | 'enormous';
  rating: number;
}

interface PerfumeData {
  notePyramid: NotePyramid;
  accords: FragranceAccord[];
  seasonality: Seasonality;
  timeOfDay: TimeOfDay;
  longevity: Longevity;
  sillage: Sillage;
  concentration?: string;
  gender?: string;
  releaseYear?: number;
  perfumer?: string;
}

interface PerfumeResultViewProps {
  productName: string;
  brand: string;
  perfumeData: PerfumeData;
}

// Labels for Russian localization
const SEASON_LABELS: Record<keyof Seasonality, string> = {
  spring: 'Весна',
  summer: 'Лето',
  fall: 'Осень',
  winter: 'Зима',
};

const TIME_LABELS: Record<keyof TimeOfDay, string> = {
  day: 'День',
  evening: 'Вечер',
  night: 'Ночь',
};

const SILLAGE_LABELS: Record<Sillage['level'], string> = {
  intimate: 'Интимный',
  moderate: 'Умеренный',
  strong: 'Сильный',
  enormous: 'Монстр',
};

const LONGEVITY_LABELS: Record<string, string> = {
  weak: 'Слабая',
  moderate: 'Умеренная',
  good: 'Хорошая',
  excellent: 'Отличная',
  eternal: 'Вечная',
};

const CONCENTRATION_LABELS: Record<string, string> = {
  eau_fraiche: 'Eau Fraîche (1-3%)',
  eau_de_cologne: 'Eau de Cologne (2-4%)',
  eau_de_toilette: 'Eau de Toilette (5-15%)',
  eau_de_parfum: 'Eau de Parfum (15-20%)',
  parfum: 'Parfum (20-30%)',
  extrait: 'Extrait (30%+)',
};

const GENDER_LABELS: Record<string, string> = {
  masculine: 'Мужской',
  feminine: 'Женский',
  unisex: 'Унисекс',
};

// Season colors
const SEASON_COLORS: Record<keyof Seasonality, string> = {
  spring: '#34C759',
  summer: '#FF9500',
  fall: '#FF6B35',
  winter: '#007AFF',
};

// Time colors
const TIME_COLORS: Record<keyof TimeOfDay, string> = {
  day: '#FFD60A',
  evening: '#FF9500',
  night: '#5856D6',
};

export const PerfumeResultView: React.FC<PerfumeResultViewProps> = ({
  productName,
  brand,
  perfumeData,
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => createThemedStyles(theme), [theme]);

  // Component for rating bar
  const RatingBar = ({ value, color, label }: {
    value: number;
    color: string;
    label: string;
  }) => (
    <View style={styles.ratingBarContainer}>
      <Text style={[APPLE_TEXT_STYLES.caption1, styles.ratingLabel]}>{label}</Text>
      <View style={styles.ratingBarTrack}>
        <View
          style={[
            styles.ratingBarFill,
            { width: `${value}%`, backgroundColor: color }
          ]}
        />
      </View>
      <Text style={[APPLE_TEXT_STYLES.caption1, styles.ratingValue]}>{value}%</Text>
    </View>
  );

  // Note pill component
  const NotePill = ({ note, type }: { note: string; type: 'top' | 'heart' | 'base' }) => {
    const colors = {
      top: '#FFD60A',      // Yellow for top notes
      heart: '#FF2D55',    // Pink for heart notes
      base: '#8B5CF6',     // Purple for base notes
    };

    return (
      <View style={[styles.notePill, { backgroundColor: colors[type] + '20' }]}>
        <Text style={[APPLE_TEXT_STYLES.caption1, { color: colors[type], fontWeight: '500' }]}>
          {note}
        </Text>
      </View>
    );
  };

  // Accord bar component
  const AccordBar = ({ name, strength }: { name: string; strength: number }) => (
    <View style={styles.accordContainer}>
      <View style={styles.accordLabelRow}>
        <Text style={[APPLE_TEXT_STYLES.subhead, styles.accordName]}>{name}</Text>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.accordStrength]}>{strength}%</Text>
      </View>
      <View style={styles.accordBarTrack}>
        <View
          style={[styles.accordBarFill, { width: `${strength}%` }]}
        />
      </View>
    </View>
  );

  // Star rating component
  const StarRating = ({ rating, maxRating = 10 }: { rating: number; maxRating?: number }) => (
    <View style={styles.starContainer}>
      {[...Array(maxRating)].map((_, i) => (
        <Ionicons
          key={i}
          name={i < rating ? 'star' : 'star-outline'}
          size={16}
          color={i < rating ? '#FFD60A' : theme.textTertiary}
        />
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={48} color={theme.textInverse} />
          </View>
          <Text style={[APPLE_TEXT_STYLES.title1, styles.headerTitle]}>
            {productName}
          </Text>
          <Text style={[APPLE_TEXT_STYLES.title3, styles.brandName]}>
            {brand}
          </Text>
          {perfumeData.concentration && (
            <View style={styles.concentrationBadge}>
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.concentrationText]}>
                {CONCENTRATION_LABELS[perfumeData.concentration] || perfumeData.concentration}
              </Text>
            </View>
          )}
          <View style={styles.metaRow}>
            {perfumeData.gender && (
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.metaText]}>
                {GENDER_LABELS[perfumeData.gender] || perfumeData.gender}
              </Text>
            )}
            {perfumeData.gender && perfumeData.releaseYear && (
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.metaText]}> • </Text>
            )}
            {perfumeData.releaseYear && (
              <Text style={[APPLE_TEXT_STYLES.caption1, styles.metaText]}>
                {perfumeData.releaseYear}
              </Text>
            )}
          </View>
          {perfumeData.perfumer && (
            <Text style={[APPLE_TEXT_STYLES.footnote, styles.perfumerText]}>
              Парфюмер: {perfumeData.perfumer}
            </Text>
          )}
        </View>
      </View>

      {/* Note Pyramid Section */}
      <View style={styles.section}>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
          ПИРАМИДА НОТ
        </Text>
        <View style={styles.sectionContent}>
          {/* Top Notes */}
          {perfumeData.notePyramid.top.length > 0 && (
            <View style={styles.noteGroup}>
              <View style={styles.noteGroupHeader}>
                <View style={[styles.noteIndicator, { backgroundColor: '#FFD60A' }]} />
                <Text style={[APPLE_TEXT_STYLES.headline, styles.noteGroupTitle]}>
                  Верхние ноты
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.noteDuration]}>
                  5-15 мин
                </Text>
              </View>
              <View style={styles.notesContainer}>
                {perfumeData.notePyramid.top.map((note, idx) => (
                  <NotePill key={idx} note={note} type="top" />
                ))}
              </View>
            </View>
          )}

          {/* Heart Notes */}
          {perfumeData.notePyramid.heart.length > 0 && (
            <View style={styles.noteGroup}>
              <View style={styles.noteGroupHeader}>
                <View style={[styles.noteIndicator, { backgroundColor: '#FF2D55' }]} />
                <Text style={[APPLE_TEXT_STYLES.headline, styles.noteGroupTitle]}>
                  Сердечные ноты
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.noteDuration]}>
                  2-4 часа
                </Text>
              </View>
              <View style={styles.notesContainer}>
                {perfumeData.notePyramid.heart.map((note, idx) => (
                  <NotePill key={idx} note={note} type="heart" />
                ))}
              </View>
            </View>
          )}

          {/* Base Notes */}
          {perfumeData.notePyramid.base.length > 0 && (
            <View style={styles.noteGroup}>
              <View style={styles.noteGroupHeader}>
                <View style={[styles.noteIndicator, { backgroundColor: '#8B5CF6' }]} />
                <Text style={[APPLE_TEXT_STYLES.headline, styles.noteGroupTitle]}>
                  Базовые ноты
                </Text>
                <Text style={[APPLE_TEXT_STYLES.caption1, styles.noteDuration]}>
                  6+ часов
                </Text>
              </View>
              <View style={styles.notesContainer}>
                {perfumeData.notePyramid.base.map((note, idx) => (
                  <NotePill key={idx} note={note} type="base" />
                ))}
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Accords Section */}
      {perfumeData.accords.length > 0 && (
        <View style={styles.section}>
          <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
            АККОРДЫ
          </Text>
          <View style={styles.sectionContent}>
            {perfumeData.accords
              .sort((a, b) => b.strength - a.strength)
              .slice(0, 8)
              .map((accord, idx) => (
                <AccordBar key={idx} name={accord.name} strength={accord.strength} />
              ))}
          </View>
        </View>
      )}

      {/* Performance Section */}
      <View style={styles.section}>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
          ХАРАКТЕРИСТИКИ
        </Text>
        <View style={styles.sectionContent}>
          {/* Longevity */}
          <View style={styles.performanceRow}>
            <View style={styles.performanceIcon}>
              <Ionicons name="time-outline" size={24} color="#5856D6" />
            </View>
            <View style={styles.performanceContent}>
              <Text style={[APPLE_TEXT_STYLES.headline, styles.performanceTitle]}>
                Стойкость
              </Text>
              <Text style={[APPLE_TEXT_STYLES.body, styles.performanceValue]}>
                {LONGEVITY_LABELS[perfumeData.longevity.description] || perfumeData.longevity.description}
                {' • '}{perfumeData.longevity.hours}+ часов
              </Text>
              <StarRating rating={perfumeData.longevity.rating} />
            </View>
          </View>

          {/* Sillage */}
          <View style={[styles.performanceRow, styles.lastRow]}>
            <View style={styles.performanceIcon}>
              <Ionicons name="cloud-outline" size={24} color="#5856D6" />
            </View>
            <View style={styles.performanceContent}>
              <Text style={[APPLE_TEXT_STYLES.headline, styles.performanceTitle]}>
                Шлейф
              </Text>
              <Text style={[APPLE_TEXT_STYLES.body, styles.performanceValue]}>
                {SILLAGE_LABELS[perfumeData.sillage.level]}
              </Text>
              <StarRating rating={perfumeData.sillage.rating} />
            </View>
          </View>
        </View>
      </View>

      {/* Seasonality Section */}
      <View style={styles.section}>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
          СЕЗОННОСТЬ
        </Text>
        <View style={styles.sectionContent}>
          {(Object.keys(perfumeData.seasonality) as Array<keyof Seasonality>).map((season) => (
            <RatingBar
              key={season}
              label={SEASON_LABELS[season]}
              value={perfumeData.seasonality[season]}
              color={SEASON_COLORS[season]}
            />
          ))}
        </View>
      </View>

      {/* Time of Day Section */}
      <View style={styles.section}>
        <Text style={[APPLE_TEXT_STYLES.caption1, styles.sectionHeader]}>
          ВРЕМЯ СУТОК
        </Text>
        <View style={styles.sectionContent}>
          {(Object.keys(perfumeData.timeOfDay) as Array<keyof TimeOfDay>).map((time) => (
            <RatingBar
              key={time}
              label={TIME_LABELS[time]}
              value={perfumeData.timeOfDay[time]}
              color={TIME_COLORS[time]}
            />
          ))}
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};

const createThemedStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundSecondary,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 18,
    backgroundColor: '#5856D6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: theme.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  brandName: {
    color: theme.textSecondary,
    marginBottom: 12,
  },
  concentrationBadge: {
    backgroundColor: '#5856D6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  concentrationText: {
    color: theme.textInverse,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: theme.textSecondary,
  },
  perfumerText: {
    color: theme.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionHeader: {
    color: theme.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 16,
  },
  noteGroup: {
    marginBottom: 16,
  },
  noteGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 10,
  },
  noteGroupTitle: {
    color: theme.text,
    flex: 1,
  },
  noteDuration: {
    color: theme.textSecondary,
  },
  notesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 14,
  },
  notePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  accordContainer: {
    marginBottom: 14,
  },
  accordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  accordName: {
    color: theme.text,
  },
  accordStrength: {
    color: theme.textSecondary,
  },
  accordBarTrack: {
    height: 8,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  accordBarFill: {
    height: '100%',
    backgroundColor: '#5856D6',
    borderRadius: 4,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  performanceIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#5856D620',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  performanceContent: {
    flex: 1,
  },
  performanceTitle: {
    color: theme.text,
    marginBottom: 2,
  },
  performanceValue: {
    color: theme.textSecondary,
    marginBottom: 6,
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingLabel: {
    width: 55,
    color: theme.text,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 4,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  ratingValue: {
    width: 35,
    textAlign: 'right',
    color: theme.textSecondary,
  },
});

export default PerfumeResultView;
