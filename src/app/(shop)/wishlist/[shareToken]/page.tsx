import SharedWishlistContent from '@/components/user/SharedWishlistContent';

type Props = { params: Promise<{ shareToken: string }> };

export default async function SharedWishlistPage({ params }: Props) {
  const { shareToken } = await params;
  return <SharedWishlistContent shareToken={shareToken} />;
}
