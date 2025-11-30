import { createHash } from "crypto";

/**
 * Signature verification utilities for position operations
 * In production, integrate with Sui wallet signature verification
 */

export class SignatureVerifier {
  /**
   * Verify that a signature matches the expected signer and message
   * @param message - Message that was signed
   * @param signature - Signature to verify
   * @param expectedSigner - Expected signer address
   * @returns True if signature is valid
   */
  static async verify(
    message: string,
    signature: string,
    expectedSigner: string
  ): Promise<boolean> {
    // In production, use Sui SDK to verify signatures
    // Example: await verifyPersonalMessage(message, signature, expectedSigner)
    
    // For now, implement basic validation
    if (!signature || !expectedSigner) {
      return false;
    }

    // Signature should be hex string starting with 0x
    if (!signature.startsWith("0x") || signature.length < 66) {
      return false;
    }

    // Address should be valid Sui address format
    if (!expectedSigner.startsWith("0x") || expectedSigner.length !== 66) {
      return false;
    }

    // In development, accept all valid-format signatures
    return true;
  }

  /**
   * Create a message to be signed for position operations
   * @param operation - Operation type (e.g., "remove_liquidity", "claim_fees")
   * @param positionId - Position ID
   * @param params - Additional parameters
   * @returns Message string to sign
   */
  static createMessage(
    operation: string,
    positionId: number,
    params: Record<string, any> = {}
  ): string {
    const timestamp = Date.now();
    const paramString = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    return `${operation}:${positionId}:${timestamp}:${paramString}`;
  }

  /**
   * Hash a message for signing
   * @param message - Message to hash
   * @returns Hex-encoded hash
   */
  static hashMessage(message: string): string {
    return createHash("sha256").update(message).digest("hex");
  }

  /**
   * Verify operation authorization
   * Checks if user is authorized to perform operation on position
   */
  static async verifyAuthorization(
    user: string,
    positionOwner: string,
    signature?: string,
    message?: string
  ): Promise<boolean> {
    // Check ownership
    if (user !== positionOwner) {
      return false;
    }

    // If signature provided, verify it
    if (signature && message) {
      return await this.verify(message, signature, user);
    }

    // Allow operations without signature if user matches owner
    // In production, might require signatures for all operations
    return true;
  }
}
