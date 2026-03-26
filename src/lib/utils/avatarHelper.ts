export function getAvatarFileName(avatarId: string | null | undefined): string | undefined {
  if (!avatarId) return undefined;
  return `avatar-${avatarId}`;
}