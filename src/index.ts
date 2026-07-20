// ============================================================================
// Clube da Esquerda - Main Exports
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────
// Design System Components
// ─────────────────────────────────────────────────────────────────────────
export { EmbroideryButton, type ThreadColor } from './components/EmbroideryButton';
export type { default as EmbroideryButtonProps } from './components/EmbroideryButton';
export { EmbroideryLogo } from './components/EmbroideryLogo';

// ─────────────────────────────────────────────────────────────────────────
// User Profile CRUD Components
// ─────────────────────────────────────────────────────────────────────────
export { PhotoUpload } from './components/PhotoUpload';
export { DescriptionInput } from './components/DescriptionInput';
export { BannerSelector } from './components/BannerSelector';
export { InterestSelector } from './components/InterestSelector';
export { MultiSelectButton } from './components/MultiSelectButton';

// ─────────────────────────────────────────────────────────────────────────
// User Profile Hooks
// ─────────────────────────────────────────────────────────────────────────
export { useProfile } from './hooks/useProfile';

// ─────────────────────────────────────────────────────────────────────────
// User Profile Types
// ─────────────────────────────────────────────────────────────────────────
export type {
  UserProfile,
  Banner,
  Interest,
  CreateUserProfileDTO,
  UpdateUserProfileDTO,
} from './types/profile';

// ─────────────────────────────────────────────────────────────────────────
// User Profile Data
// ─────────────────────────────────────────────────────────────────────────
export { BANNERS } from './data/banners';
export { INTERESTS } from './data/interests';

// ─────────────────────────────────────────────────────────────────────────
// Pages
// ─────────────────────────────────────────────────────────────────────────
export { UserProfilePage } from './pages/UserProfilePage';
export { ProfileCrudDemo } from './pages/ProfileCrudDemo';
export { DesignSystemShowcase } from './pages/DesignSystemShowcase';
