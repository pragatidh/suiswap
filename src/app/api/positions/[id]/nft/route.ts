import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { positions } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * NFT position linking endpoint
 * Records on-chain NFT token ID and transaction hash after minting
 * Also handles NFT reconciliation for failed mints
 */

interface UpdateNFTRequest {
  nft_token_id: string;
  nft_tx_hash: string;
  owner: string;
}

interface MarkMintFailedRequest {
  owner: string;
  reason?: string;
}

/**
 * PATCH: Update position with NFT token ID after successful mint
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const positionId = parseInt(params.id);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { error: "Invalid position ID" },
        { status: 400 }
      );
    }

    const body: UpdateNFTRequest = await request.json();

    if (!body.nft_token_id || !body.nft_tx_hash || !body.owner) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update position with NFT details
    const result = await db
      .update(positions)
      .set({
        nftTokenId: body.nft_token_id,
        nftTxHash: body.nft_tx_hash,
        mintPending: false,
      })
      .where(
        and(
          eq(positions.id, positionId),
          eq(positions.ownerAddress, body.owner)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Position not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      position_id: positionId,
      nft_token_id: body.nft_token_id,
      nft_tx_hash: body.nft_tx_hash,
      mint_pending: false,
    });
  } catch (error: any) {
    console.error("NFT update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update NFT details" },
      { status: 500 }
    );
  }
}

/**
 * POST: Mark NFT mint as failed (for reconciliation)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const positionId = parseInt(params.id);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { error: "Invalid position ID" },
        { status: 400 }
      );
    }

    const body: MarkMintFailedRequest = await request.json();

    if (!body.owner) {
      return NextResponse.json(
        { error: "Missing owner field" },
        { status: 400 }
      );
    }

    // Keep mint_pending true but record failure for manual reconciliation
    const result = await db
      .update(positions)
      .set({
        mintPending: true, // Keep pending for retry
      })
      .where(
        and(
          eq(positions.id, positionId),
          eq(positions.ownerAddress, body.owner)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Position not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      position_id: positionId,
      mint_pending: true,
      message: "Position marked for NFT mint retry",
      reason: body.reason,
    });
  } catch (error: any) {
    console.error("NFT mint failure recording error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record mint failure" },
      { status: 500 }
    );
  }
}

/**
 * GET: Check NFT status for a position
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const positionId = parseInt(params.id);
    if (isNaN(positionId)) {
      return NextResponse.json(
        { error: "Invalid position ID" },
        { status: 400 }
      );
    }

    const result = await db
      .select({
        nftTokenId: positions.nftTokenId,
        nftTxHash: positions.nftTxHash,
        mintPending: positions.mintPending,
      })
      .from(positions)
      .where(eq(positions.id, positionId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    const position = result[0];

    return NextResponse.json({
      position_id: positionId,
      nft_token_id: position.nftTokenId,
      nft_tx_hash: position.nftTxHash,
      mint_pending: position.mintPending,
      has_nft: position.nftTokenId !== null,
    });
  } catch (error: any) {
    console.error("NFT status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check NFT status" },
      { status: 500 }
    );
  }
}
