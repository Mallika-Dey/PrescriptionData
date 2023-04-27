const PrescriptionData = ({ prescription }) => {
    return ( 
    	<> 
    	{
            prescription.map((it) => {
                const { id, PID, name, disease, date } = it;

                return (
                	<tr key={id}>
                		<td>{id}</td>
                		<td>{PID}</td>
                		<td>{name}</td>
                		<td>{disease}</td>
                		<td>{date}</td>
                	</tr>
                )
            })

        } 
        </>
    )
}

export default PrescriptionData;