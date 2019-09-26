# How Saito Compares

Saito is a fundamentally new class of blockchain. The differences start with the problems Saito solves. This document describes some of these important differences.


## 1. PROBLEM ONE

### Other Blockchains focus on... 

*How to Make Block Production Difficulty:*

Proof-of-work (POW) and proof-of-stake (POS) blockchains make block production difficult and give all of their funds to the block producer. Attackers who can buy or rent 50 percent of the "work" needed to produce blocks can collect up to 100 percent of network revenue, or even more if they are willing to launch double-spending attacks.

In consensus systems like Tendermint where validators determine which blocks are valid, the cost of attack is technically even lower and networks can be forced into paralysis by attackers with only 34 percent of network stake. Similar problems with majority dominance occurs in DAG structures. Economic forces incentivize and encourage collusion in these networks.

Making matters worse, the techniques these networks use to make attacks "difficult" rely on markets (for hashpower or capital) which exist outside the control of the blockchain. Not only does this make most networks susceptible to basic economic attacks (see "discouragement attacks" etc.), but the existence of the blockchain itself incentivizes the commoditization of the supply curve for the block-production resource. Economic forces unleashed by the blockchain undermine its security over the long-run.


Saito focuses on:

How to Guarantee Attacks are Expensive:

Saito recognizes that all forms of "difficulty" are reducible to economics. This is why it solves a different problem: guaranteeing that it is always expensive to produce blocks. The network accomplishes this by separating the block reward from the block producer and using a provably-fair lottery to reward nodes in proportion to the amount of money they collect for the network. Honest nodes get paid by processing user transactions. Attackers have to spend their own money.

Because the way the lottery works, producing the longest chain of blocks requires attackers to spend more money than they can ever recover in fees. And because expected losses increase as transaction volume grows, the network can defend itself very easily: spending the money contributed by attackers on increased transaction flow that speeds up their transfers of wealth to the network. Attacks are truely difficulty because attackers must inevitably go bankrupt.

Guaranteeing that attacks are always expensive eliminates 51 percent attacks and changes the security dynamic of the blockchain completely. Security is more than double that of existing POW and POS networks. There are no more incentives for participants to collude. All nodes in the network can be paid for their help with fee collection, and the network remains open in all situations. Users can meanwhile continue to get quantifiable security by waiting the appropriate number of confirmations until re-writing the blockchain costs more money to attackers than any potential double-spends are worth.






## 2. PROBLEM TWO

Other Blockchains focus on...

How to Hide the Volunteers in their Systems

All non-Saito blockchains have volunteers hidden in their systems. They have volunteers hidden in the form of the businesses which collect transactions from users but somehow never think to sell that transaction flow to block producers. Volunteers in their peer-to-peer network must prevent block producers from hoarding or censoring transactions. POS implementations that pay block producers need volunteer validators to keep them in-line. POS implementations that pay validators need volunteers to propose blocks.

Data storage is also thrust unapologetically into the hands of volunteers. BSV and BCH actively discourage miners from storing blockchain data. DAGS like IOTA introduce "masternodes" which are supposed to store data, but are unpaid for the service. Hashgraph advertises itself as a data network, but encourages nodes to reduce old transactions to hashes of the transaction data. Where can a user go to actually get the data other users are pushing into the blockchain? The current craze in application networks like Blockstack is meanwhile push data off-chain onto... volunteer networks like IPFS. What is the thinking: if our volunteers won't do it, maybe theirs will?

As these networks scale, the costs to volunteers necessarily rises, pushing these networks towards technical non-solutions (lite-clients!) that decrease the cost burden on some users while shifting costs to volunteers elsewhere in the system. But they cannot do otherwise: miners are stakers are strictly incentivized to fund their revenue-earning function. At best these networks can create insecure subsidy mechanisms controlled by developers, or complicated systems with multiple payments to multiple parties and entire classes of attacks on their artificial pricing mechanism. 


Saito focuses on:

  How to Pay every Node that Contributes Value

Saito introduces and has patented the technique of adding cryptographic signatures to blockchains on their network layer. This allows the consensus mechanism to measure the actual value that routing nodes provide to the network. This is used to pay them in proportion to the value they contribute to the network: there is no need for volunteers in the businesses that connect to users or those that form part of the routing network.

Automatic transaction rebroadcasting (patent pending) eliminates the needs for volunteers to provide data storage, since nodes that do not store blockchain data are incapable of producing new blocks. Users who wish to rely on unreliable volunteer-provided storage systems or layer-two networks are of course still welcome to do so. Users who need reliable on-chain data service are able to pay for it at prices that reflect the actual market cost of storing their data.

This last point is a major point of departure from conventional blockchain economics, which have developers carve up revenues themselves: the Saito consensus mechanism unleashes market pressures within the block-creation process which auto-adjust the payments made to routing nodes and block producers so as to maximize the revenue collected by the network. There is no need for insecure and arbitrary developer-imposed subsidy mechanisms which lower security, or complicated schemes that require "validators" or "proposers" or "masternodes" to perform critical network services or whitepapers which mask the fact that these services are unpaid. The network pays for everything it needs and scales payments to bottlenecks as needed: growth pays for itself.



## 3. PROBLEM THREE

Other Blockchains focus on...

  Using Smart Contracts to Build Web 3.0

The vast majority of "application blockchains" are building smart-contract platforms.

These approaches introduce coordination problems (through sharding), network bloat (through their inability to incentivize data storage), and add sharp limits to the scalability of the underlying blockchains, as a non-trivial number of computers in the network suddenly need to be spending CPU cycles to execute these smart contracts.



Saito focuses on:

  Eliminating Bloat on the Network Layer

Saito applications run on the edge of the network. Users send transactions into the network, which broadcasts their data to all recipients. This makes it possible for applications to maintain consensus state without the need for servers in the network to do that work. Smart contract systems and meta-blockchains are programmable features which can be added atop the blockchain as a second-layer service.

This eliminates bloat on the network layer. The protocol is as simple as possible: a UTXO set with associated data in the form of byte-arrays. What the computers on the edge of the network do with this data depends on them and is not a concern of the blockchain itself. Scaling problems fall away as there is no need for all of the computers in the network to process every transaction. Sharding is possible in much simpler forms if needed, and can be handled in emergent fashion.







## 1. Categories of Problems

Proof-of-work and 

 - attacks on Saito cost more than 100 percent of fee volume
 - eliminate need for volunteers in P2P network
 - eliminate risk of transaction hoarding



 - secured by > 100% transaction fee volume
 - no volunteers in P2P network
 - no volunteers in fee-collection network
 - dis-incentivizes tx hoarding

 - sybil resistent



## 1. Categories of Problems


Proof-of-Work (small block):

Small-block proof-of-work networks rely on a volunteer network of peer-to-peer nodes to collect transactions. Miners use those fees to purchase hashpower. This puts the cost of attacking the network around 51 percent of transaction fee volume.

The lack of effective data-pruning methods in these chains creates pressures to limit the blocksize, which restricts fee throughput and reduces the security of the base layer of the network. The lack of direct funding for nodes in the peer-to-peer network also prevents these networks from achieving significant scale.

PROBLEMS:

 - secured by 51% transaction fee volume
 - requires volunteers in P2P network
 - requires volunteers to collect transactions
 - miners are incentivized to hoard transactions
 - limits to transaction sizes

Examples: BTC




Proof-of-Work (big block):

Big-block proof-of-work networks scale beyond the point where volunteers will operate nodes. The economic design of these networks requires miners or businesses to pay for the costs of collecting transactions and distributing them to all of the miners in the network. Fees are still collected entirely by miners, who use them to purchase hashpower.

As a result, the security of the network is still around 51 percent of transaction fee volume. The need to pay substantive costs to operate the network infrastructure unleashes incentives for these businesses to hoard fees and monetize transaction flows. The requirements for nodes to start operating at scale also create barriers to entry that hurt the openness of the networks.


Examples: BCH, BSV

 - secured by 51% transaction fee volume
 - incentivizes tx hoarding, fee monetization
 - scale barriers to entry
 - protocol changes (dev work)





Proof-of-Stake (stakers as block producers):

 - secured by 51% transaction fee volume
 - volunteers in P2P network


Tendermint:

 - 31% attacks
 - volunteers as block proposers
 - volunteers as validators

 - unpaid (volunteer) fee collection
	- without the ability for network nodes to , networks experience systemic underprovision of service, or API providers monetize.

 - unpaid (volunteer) network layer


## 1. Small-Block POW Networks


 - 51% attacks on consensus mechanism
 - incentivizes tx fee
 - low throughput


Saito:

 - throughput near network capacity
 - paid P2P routing layer
 - paid fee-collection




Examples: Bitcoin, Bitcoin Gold, etc.


## 2. Large-Block POW Networks

Economic models


## 1. SYBIL ATTACKS

Saito is secure against sybil attacks.

It is possible to identify sybils in Saito by examining the transaction-embedded routing paths. This ability to recognize sybils (who occupy intermediate positions in the routing network and consume more in value than they contribute to their peers) and makes Saito distinct from other blockchains, which lack the information to identify which nodes in their routing network are providing real value.

As every hop in a routing path lowers the profitability of every single node on that path, there is a strong incentive for all nodes to purge sybils from their routing paths. This is particularly the case for nodes on the inside of a sybil which experience an immediate fifty-percent drop in profitability. Nodes which fail to monitor local routing conditions and get sybilled will be less profitable than their peers, unable to compete effectively, and forced off the network through organic economic competition.

Nodes may easily route around sybils by connecting to their remote peers, using the blockchain to communicate with distant peers as necessary. 


## 2. TRANSACTION HOARDING

All blockchains which give 100 percent of the block reward to the nodes that produce blocks are vulnerable to transaction-hoarding attacks.

In these attacks, block producers who pay to collect transactions refuse to share those transactions with their peers lest those peers "free-ride" on their work and gain market share at their expanse. This problem emerges slowly as blockchains scale and the block reward falls. Hoarding is an issue for many reasons, not least that users looking for fast confirmations will direct their transactions to the largest and more profitable block producers, unleashing self-fullfiling centralization pressures.

Saito is secure against transaction hoarding attacks. It achieves this by paying the nodes which collect transactions from users the largest share of the routing payment. Access nodes are incentivized to form at user-facing portions of the network - ensuring there will always be nodes willing to offer routing services offering competitive and efficient routing into the network.

Once transactions are in the network, the profitability of routing nodes depends on their forwarding received transactions as quickly and efficiently as possible. Any nodes which hoard transactions risk losing the value of their work completely. But those who do forward will earn revenue from routing work even if they are not able to produce a block. Simultaneously, the transaction-embedded routing paths allows users and nodes to monitor the behavior of their peers and negotiate reasonable terms of service given local economic conditions.


## 3. BLOCK-FLOODING ATTACKS

Proof-of-Work networks require block producers to burn money to produce viable blocks. All peers are expected to forward all blocks by default, under the understanding that the costs needed to create a block prevent block-flooding (DOS) attacks on the network.

Saito imposes the same block-flooding protections by stipulating that peers only forward blocks once they have been convinced those blocks form part of the longest-chain. While nodes may thus forward the first block they receive from attackers, they will not forward subsequent blocks at the same block depth. The fact that every additional block produced imposes a cost on attackers ensures that this approach provides the same guarantee: attackers cannot flood the network with data without paying the cost of block production.

It should be noted that the cost of producing the longest chain is higher in Saito than Bitcoin, providing double the effective security against DOS attacks. Additionally, the economic structure of the routing network incentivizes nodes to monitor their peers and maintain efficient network connections. While nodes on the edge of the network may offer attackers an access point for data-flooding attacks, high-throughput nodes towards the center have strong economic incentives to penalizes peers which impose undue costs on them. Malicious nodes must necessarily start their attacks from positions on the edge of the network, where their attacks can be easily overcome by the honest network and face higher costs for success.


## 4. GRINDING ATTACKS

Proof-of-Stake networks without an explicit cost to block production are susceptible to grinding attacks. These occur when it is possible for nodes to create a large number of variant blocks in order to find one that benefits them.

This is not possible in Saito as block producers have no control over the block reward. Nodes which delay producing blocks for any reason also risk losing the entire value of their routing work, lowering their profitability and alienating the routing nodes with whom they are cooperating in sourcing transaction flow. Miners who find a golden ticket and fail to submit it promptly will not find another in time to collect any payment.


## 5. 51\% ATTACKS

Saito is the only blockchain that is fully secure against 51 percent attacks. To understand how Saito accomplishes this, note that attackers who wish to attack the blockchain must necessary produce the same amount of routing work as the honest nodes as a prerequisite for issuing the longest-chain. Once that is done they must then match the amount of honest mining in the network in order to produce the golden tickets which allow them to get their money back from these blocks.

Security reaches the 100 percent level as attackers who do not include the "routing work" of honest nodes in their attack blocks face a non-stop increase in attack costs. Not only are they forced to match ALL CUMULATIVE OUTSTANDING ROUTING WORK when producing blocks (requiring a limitless increase in tokens) but the increased pace of block production traps miners in a situation where their mining costs must also rise as less time is available between blocks to find valid solutions.

The only way attackers can escape this trap is by "defusing" the accumulation of "routing work" outside their fork by including other people's transactions in their blocks. But in this case attackers must necessarily double their mining costs as it now takes two golden tickets on average to find a solution that will pay them (rather than an honest routing node) the block revenue. The security of the network is guaranteed by 100 percent of fee volume rather than merely 51 percent.


## 6. THE DEATH OF MOORE'S LAW

Blockchains secured by proof-of-work collapse once the supply curve of hashpower becomes reasonably elastic. This is why the death of Moore's Law is an existential threat all proof-of-work chains: commodity hardware production makes the slope of the supply curve for hashpower fully elastic. This problem is also why the shrinking block reward is a major issue for Bitcoin, as reduced miner revenue slows the pace of improvements in mining technology and makes 51 percent attacks feasible as well as profitable.

Saito remains secure beyond the death of Moore's Law. The reason for this is that the golden ticket system ensures that collecting 100 percent of the routing reward always costs 100 percet of network fees. The addition of proof-of-stake component adds a deadweight loss *on top of this* that imposes costs on attackers that are proportional to the percentage of the stake that is not controlled by the attacker multiplied by the proportion of total network revenue that is allocated to the staking pool.

As a result, the only situation in which attackers can theoretically avoid losing money attacking the network is if they control 100 percent of network hashpower, control 100 percent of the outstanding network stake, and are able to match 100 percent of the network stake. But even in this situation, the rational response for users facing an attack (an increase in the pace of block production) is to expand their own stake in the network. Economic forces move the network back to security even from extremes of centralized control. This is different from existing proof-of-stake implementations, in which stakers have an incentive to liquidate their stake when the network comes under attack.


## 7. I-HAVE-ALL-THIS-MONEY-WHY-DEAR-GOD-WILL-NO-ONE-SELL-ME-A-PEPSI ATTACKS

Occasionally people new to Saito think their way into circular critiques where there is some hypothetical attack on a Saito node that consists of an attacker maneuvering itself into being someone's only point of access to the network and leveraging that to censor transaction flows, extract supra-market rents or produce a dummy blockchain at a much slower rate than the chain produced by the honest network. We call these I-HAVE-ALL-THIS-MONEY-WHY-DEAR-GOD-WILL-NO-ONE-SELL-ME-A-PEPSI attacks.

All consensus systems fail in situations where one's view of the longest chain (i.e. consensus) is dictated by an attacker. Saito is no different than other blockchains in this regard. For those concerned about these issues, the important thing to note is that only Saito provides explicit economic incentives that prevent these issues. While proof-of-work and proof-of-stake variant networks typically suffer from an underprovision of unpaid access nodes, in Saito access to the network is easy: any scarcity in access points is an immediate and profitable commercial opportunity.


## 8. OTHER ATTACKS

Concerned about other attacks? Contact us at info@saito.tech and we will expand this document to clarify any outstanding issues.


