import { CanActivate, ExecutionContext, Type } from "@nestjs/common";
import { APIClient } from "@greymass/eosio";
import { IdentityProof } from "eosio-signing-request";
import { AxiosAPIProvider } from "./axios-provider";

interface ProofPayload {
  proof: {
    chainId: string;
    expiration: string;
    signer: {
      actor: string;
      permission: string;
    };
    signature: string;
    scope: string;
  };
}

export const AnchorAuthGuard = (rpc?: string): Type<CanActivate> => {
  class AuthGuard implements CanActivate {
    rpc = rpc || "https://eos.greymass.com";

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const [req] = context.getArgs();
      const { body } = req as { body: ProofPayload };

      const proof = IdentityProof.from(body.proof);

      const client = new APIClient({
        provider: new AxiosAPIProvider(this.rpc),
      });

      const accountName = proof.signer.actor;

      const account = await client.v1.chain.get_account(accountName);
      const auth = account.getPermission(proof.signer.permission).required_auth;
      const valid = proof.verify(auth, account.head_block_time);

      if (valid) {
        req.anchor = {
          account: {
            actor: proof.signer.actor.toString(),
            permission: proof.signer.permission.toString(),
          },
          object: account.toJSON(),
        };
        return true;
      } else {
        return false;
      }
    }
  }

  return AuthGuard;
};
