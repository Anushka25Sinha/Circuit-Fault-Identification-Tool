const fs = require('fs');

// Function to evaluate the circuit's logic based on inputs
const evaluateFaultyCircuit = (circuit, inputs, faultNode, faultType) => {
    const values = { A: -1, B: -1, C: -1, D: -1, Z: -1 }; // Values of inputs (A, B, C, D) and output (Z)

    // Set the input values
    for (const key of Object.keys(inputs)) {
        values[key] = inputs[key];
    }

    // Iterate over each line in the circuit
    for (const line of circuit) {
        const tokens = line.split(/([=,&,|,~,^])/);
        let [result, equal, operand1, gate, operand2] = tokens;

        // Remove leading/trailing spaces from input symbols
        result = result.trim();
        operand1 = operand1.trim();
        operand2 = operand2.trim();

        let operandValue1 = values[operand1];
        let operandValue2 = values[operand2];

        // Perform logic operations based on the gate type
        if (gate === '&')
            values[result] = (result === faultNode) ? faultType : operandValue1 & operandValue2;  // assign faultValue to the faulty Node else assign correct value
        else if (gate === '|')
            values[result] = (result === faultNode) ? faultType : operandValue1 | operandValue2;
        else if (gate === '~')
            values[result] = (result === faultNode) ? faultType : (!operandValue2) ? 1 : 0;
        else if (gate === '^')
            values[result] = (result === faultNode) ? faultType : operandValue1 ^ operandValue2;
    }

    return values;
}

function evaluateCircuit(circuit, inputs) {
    for (const line of circuit) {
        const tokens = line.split(/([=,&,|,~,^])/);
        let [result, equal, operand1, gate, operand2] = tokens;
        result = result.trim();
        operand1 = operand1.trim();
        operand2 = operand2.trim();

        const operandValue1 = inputs[operand1];
        const operandValue2 = inputs[operand2];
        if (gate === '&')
            inputs[result] = operandValue1 & operandValue2;
        else if (gate === '|')
            inputs[result] = operandValue1 | operandValue2;
        else if (gate === '~')
            inputs[result] = (!operandValue2) ? 1 : 0;
        else if (gate === '^')
            inputs[result] = operandValue1 ^ operandValue2;
    }
    return inputs;
}

// Function to find the input vector to identify a fault
function findFaultInput(circuit, faultNode, faultType) {
    const inputs = { A: 0, B: 0, C: 0, D: 0 } // Initialize inputs with all zeros
    let faultInputs = [];
    let expectedZ = -1;

    // Loop through all possible input vectors
    for (let i = 0; i < 16; i++) {
        let notation = ['D', 'C', 'B', 'A'];

        for (let j = 0; j < 4; j++) {
            inputs[notation[j]] = (i >> j) & 1; // Set inputs based on the binary representation of i
        }

        // Evaluate the circuit with the current input vector without faultNode
        const values = evaluateCircuit(circuit, inputs);

        // Evaluate the circuit with the current input vector with faultNode
        const faultValues = evaluateFaultyCircuit(circuit, inputs, faultNode, (faultType === "SA0" ? 0 : 1));

        // Check if the fault at the faultNode is detected
        if ((faultType === 'SA0' && values[faultNode] && faultValues['Z'] !== values['Z']) ||
            (faultType === 'SA1' && !values[faultNode] && faultValues['Z'] !== values['Z'])) {
            faultInputs = inputs;
            expectedZ = faultValues['Z'];
            break;
        }
    }
    return [faultInputs, expectedZ];
}

const inputVectorGenerator = () => {
    // Read the circuit file
    const circuitFile = fs.readFileSync('circuit.txt', 'utf8');

    const circuit = circuitFile.split('\n').filter((line) => line.trim() !== '');
    const faultNode = 'net_f'; // Example fault node location
    const faultType = 'SA0'; // Example fault type

    const [faultInputs, Z] = findFaultInput(circuit, faultNode, faultType);
    const { A, B, C, D } = faultInputs;
    console.log(`[A,B,C,D] = [${A},${B},${C},${D}], Z=${Z}`);  // printing sample result in the terminal

    // write the final output in output.txt file
    fs.writeFileSync('output.txt', `[A,B,C,D] = [${A},${B},${C},${D}], Z=${Z}`);
}

// calling the inputVectorGenerator
inputVectorGenerator();