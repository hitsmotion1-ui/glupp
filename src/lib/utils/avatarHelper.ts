// Petit helper pour construire le fileName à partir de avatar_id
// avatar_id = "curieux" → fileName = "avatar-curieux"
export function getAvatarFileName(avatarId: string | null | undefined): string | undefined {
  if (!avatarId) return undefined;
  return `avatar-${avatarId}`;
}
