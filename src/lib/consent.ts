export function consentStatement(p: { ownerName: string; orgName: string; commercialUse: boolean }) {
  return (
    `I, ${p.ownerName}, confirm that the voice in the recordings provided is my own. ` +
    `I give ${p.orgName} permission to create an AI replica of my voice on LinguaDub and to use it to generate speech ` +
    (p.commercialUse ? "in content that may be used commercially. " : "for non commercial content only. ") +
    "I understand that I can revoke this permission at any time, after which the replica will be deleted."
  );
}
